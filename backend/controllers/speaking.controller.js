import { supabase } from "../config/supabaseClient.js";
import path from "path";
import fs from "fs";
import OpenAI from "openai";
import { detectSilence } from "../utils/audioValidator.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const startSpeakingSession = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Missing Authorization header"
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user"
      });
    }

    const studentId = user.id;

    const deleteAfter = new Date();
    deleteAfter.setDate(deleteAfter.getDate() + 4); // 4-day lifecycle

    const { data, error } = await supabase
      .from("speaking_sessions")
      .insert([
        {
          student_id: studentId,
          status: "started",
          audio_delete_after: deleteAfter.toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Speaking session started",
      data
    });
  } catch (error) {
    console.error("❌ Start session error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const completeSpeakingSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1️⃣ Update session status in DB
    const { data, error } = await supabase
      .from("speaking_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .eq("status", "started") // prevents double-complete
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({
        success: false,
        message: "Session already completed or not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Speaking session completed",
      data
    });
  } catch (error) {
    console.error("❌ Complete session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete speaking session"
    });
  }
};

export const testSupabaseConnection = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Supabase connection is working ✅"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Supabase connection failed ❌"
    });
  }
};

export const uploadSpeakingResponse = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, audioDuration } = req.body;

    // 1️⃣ Fetch session FIRST
const { data: session, error: sessionError } = await supabase
  .from("speaking_sessions")
  .select("status")
  .eq("id", sessionId)
  .single();

if (sessionError || !session) {
  return res.status(404).json({
    success: false,
    message: "Session not found"
  });
}

// 2️⃣ HARD STOP if session is locked
if (session.status !== "started") {
  return res.status(403).json({
    success: false,
    message: "This speaking session is locked. Uploads are not allowed."
  });
}

// 🔒 Enforce max question limit (authoritative DB count)
const MAX_QUESTIONS = 15;

const { count, error: responseCountError } = await supabase
  .from("speaking_responses")
  .select("*", { count: "exact", head: true })
  .eq("session_id", sessionId);

if (responseCountError) {
  return res.status(500).json({
    success: false,
    message: "Failed to validate response count"
  });
}

if (count >= MAX_QUESTIONS) {
  return res.status(403).json({
    success: false,
    message: "Maximum responses reached. Session is locked."
  });
}

    // 2.5️⃣ Validate questionId from speaking_questions
    const { data: questionData, error: questionError } = await supabase
      .from("speaking_questions")
      .select("id")
      .eq("id", questionId)
      .single();

    if (questionError || !questionData) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID. Question not found in DB."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required"
      });
    }

    // 3️⃣ SILENCE DETECTION (Protect Storage & Whisper)
    const isSilent = await detectSilence(req.file.path);
    if (isSilent) {
      // Clean up the silent file
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      
      return res.status(400).json({
        success: false,
        message: "No speech detected. Please check your microphone."
      });
    }

    // Build storage path
    let fileExt = path.extname(req.file.originalname);
    if (!fileExt || fileExt === '.blob') {
      fileExt = '.webm'; // Fallback for Blobs sent from frontend
    }
    const storagePath = `sessions/${sessionId}/${questionId}${fileExt}`;

    // Upload to Supabase Storage
    const fileBuffer = fs.readFileSync(req.file.path);

    const { error: uploadError } = await supabase.storage
      .from("speaking-audio")
      .upload(storagePath, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Insert DB row
    const { data, error } = await supabase
      .from("speaking_responses")
      .insert([
        {
          session_id: sessionId,
          question_id: questionId,
          audio_path: storagePath,
          audio_duration: audioDuration
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Response uploaded",
      data
    });
  } catch (err) {
    console.error("Upload response error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const getSpeakingSessionSummary = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1️⃣ Fetch session + student
    const { data: session, error: sessionError } = await supabase
      .from("speaking_sessions")
      .select(`
        id,
        status,
        started_at,
        completed_at,
        ai_band_score,
        ai_feedback,
        students (
          id,
          full_name,
          email
        )
      `)
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // 2️⃣ HARD STOP if session not evaluated
    if (session.status !== "evaluated") {
      return res.status(403).json({
        success: false,
        message: "Session not completed yet"
      });
    }

    // 3️⃣ Fetch all responses (ordered)
    const { data: responses, error: responseError } = await supabase
      .from("speaking_responses")
      .select(`
        id,
        audio_path,
        audio_duration,
        transcript,
        word_timestamps,
        words_per_minute,
        long_pauses,
        speech_ratio,
        created_at,
        speaking_questions (
          id,
          part,
          question_text,
          order_number
        )
      `)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (responseError) throw responseError;

    // 4️⃣ Generate signed URLs for audio files
    const responsesWithUrls = await Promise.all(
      responses.map(async (response) => {
        if (!response.audio_path) return response;

        const { data, error } = await supabase.storage
          .from("speaking-audio")
          .createSignedUrl(response.audio_path, 3600);

        return {
          ...response,
          audioUrl: data?.signedUrl || null
        };
      })
    );
    // 4️⃣ Compute total speaking time
    const totalDuration = responses.reduce(
      (sum, r) => sum + (r.audio_duration || 0),
      0
    );

    // 5️⃣ Final response
    return res.status(200).json({
      success: true,
      data: {
        session: {
          id: session.id,
          ai_band_score: session.ai_band_score,
          ai_feedback: session.ai_feedback,
          started_at: session.started_at,
          completed_at: session.completed_at
        },
        student: session.students,
        total_questions: responses.length,
        total_speaking_time_seconds: totalDuration,
        responses: responsesWithUrls
      }
    });
  } catch (error) {
    console.error("❌ Session summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch session summary"
    });
  }
};

export const evaluateAISession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // 1️⃣ Fetch responses
    const { data: responses, error } = await supabase
      .from("speaking_responses")
      .select(`
        id,
        question_id,
        audio_path,
        audio_duration,
        speaking_questions (
          question_text,
          part
        )
      `)
      .eq("session_id", sessionId)
      .order("created_at");

    if (error || !responses.length) {
      return res.status(404).json({
        success: false,
        message: "No responses found for evaluation"
      });
    }

    let fullTranscript = "";
    let totalDuration = 0;
    let totalSessionWords = 0;

    for (const response of responses) {
      totalDuration += response.audio_duration || 0;

      const tempFilePath = path.join(
        process.cwd(),
        `temp-${response.id}.webm`
      );

      try {
        // 1️⃣ Download audio from Supabase
        const { data: fileData, error: downloadError } =
          await supabase.storage
            .from("speaking-audio")
            .download(response.audio_path);

        if (downloadError) throw downloadError;

        // Save temporarily
        const buffer = Buffer.from(await fileData.arrayBuffer());
        fs.writeFileSync(tempFilePath, buffer);

        // 2️⃣ Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFilePath),
          model: "whisper-1",
          response_format: "verbose_json"
        });

        const transcriptText = transcription.text;
        const segmentTimestamps = transcription.segments || [];

        // 🔹 Fluency Analytics
        const wordsArray = transcriptText.trim().split(/\s+/);
        const wordsCount = wordsArray.length;
        totalSessionWords += wordsCount;

        const minutes = (response.audio_duration || 1) / 60;
        const wordsPerMinute = wordsCount / minutes;

        let longPauses = 0;
        let speechTime = 0;

        for (let i = 0; i < segmentTimestamps.length; i++) {
          speechTime += segmentTimestamps[i].end - segmentTimestamps[i].start;

          if (i > 0) {
            const gap = segmentTimestamps[i].start - segmentTimestamps[i - 1].end;
            if (gap > 1.5) longPauses++;
          }
        }

        const speechRatio = speechTime / (response.audio_duration || 1);

        // 3️⃣ Save transcript in DB
        await supabase
          .from("speaking_responses")
          .update({
            transcript: transcriptText,
            word_timestamps: segmentTimestamps,
            words_count: wordsCount,
            words_per_minute: wordsPerMinute,
            long_pauses: longPauses,
            speech_ratio: speechRatio
          })
          .eq("id", response.id);

        fullTranscript += `
--- PART ${response.speaking_questions?.part || 'UNKNOWN'} ---
QUESTION:
${response.speaking_questions?.question_text || 'No question text provided'}

STUDENT RESPONSE:
${transcriptText}

`;
      } finally {
        // Delete temp file regardless of success or failure
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }

    // 4️⃣ TRANSCRIPT FALLBACK PROTECTION (Protect GPT Cost)
    if (totalSessionWords < 10) {
      return res.status(400).json({
        success: false,
        message: "We couldn’t detect enough speech for evaluation. Please try again."
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a certified IELTS Speaking Examiner.

Below is a student's IELTS Speaking response and the question they answered.

Your task is to generate a COMPLETE evaluation + learning feedback system.

-------------------------------------
SECTION 1: IELTS BAND EVALUATION
-------------------------------------

Evaluate strictly based on official IELTS criteria:

1. Fluency and Coherence  
2. Lexical Resource  
3. Grammatical Range and Accuracy  
4. Pronunciation  

For EACH:

- Give band score (0–9, allow .5)
- Give detailed explanation using IELTS descriptors

Then provide:

- Overall Band Score (rounded to .5)
- Summary paragraph
- Pacing and Hesitation: Provide specific feedback on the student's pacing, pauses, and hesitation.

-------------------------------------
SECTION 2: PERFORMANCE ANALYTICS
-------------------------------------

Analyze transcript deeply and return:

- filler_words_count (e.g. um, uh, like)
- repetitions_count
- long_pauses_count (>2 seconds)
- words_per_minute (estimate)
- fluency_observation (short explanation)

-------------------------------------
SECTION 3: VOCABULARY ENHANCEMENT
-------------------------------------

Based STRICTLY on student's actual mistakes and level:

### A. Recommendations (3–5 items)

Format:
- instead_of
- better_alternatives (2–3)
- reason
- example_sentence (NEW sentence, not copied)

### B. Topic Words (5–8 words)

Each must include:
- word
- level (Intermediate / Advanced)
- meaning
- example_sentence

(MUST be relevant to student's topic)

### C. Useful Phrases (5–7 phrases)

Each must include:
- phrase
- usage
- category (Opinion / Contrast / etc.)
- example_sentence

-------------------------------------
SECTION 4: STRENGTHS & IMPROVEMENTS
-------------------------------------

- Strengths (3–5)
- Areas for improvement (3–5)

-------------------------------------
STRICT RULES
-------------------------------------

- DO NOT repeat student's transcript
- DO NOT use markdown or formatting symbols
- ALL output must be structured JSON ONLY
- Base everything ONLY on student's response
- Keep tone professional and examiner-like

-------------------------------------
OUTPUT FORMAT (STRICT JSON)
-------------------------------------

Return ONLY JSON in this exact structure:

{
  "scores": {
    "fluency": number,
    "lexical": number,
    "grammar": number,
    "pronunciation": number,
    "overall": number
  },
  "feedback": {
    "fluency": "...",
    "lexical": "...",
    "grammar": "...",
    "pronunciation": "...",
    "summary": "...",
    "pacing_and_hesitation": "..."
  },
  "analytics": {
    "filler_words": number,
    "repetitions": number,
    "long_pauses": number,
    "wpm": number,
    "fluency_note": "..."
  },
  "vocabulary": {
    "recommendations": [
      {
        "instead_of": "...",
        "better": ["...", "..."],
        "reason": "...",
        "example": "..."
      }
    ],
    "topic_words": [
      {
        "word": "...",
        "level": "...",
        "meaning": "...",
        "example": "..."
      }
    ],
    "phrases": [
      {
        "phrase": "...",
        "usage": "...",
        "category": "...",
        "example": "..."
      }
    ]
  },
  "strengths": ["...", "..."],
  "improvements": ["...", "..."]
}`
        },
        {
          role: "user",
          content: fullTranscript
        }
      ]
    });

    const aiResponse = completion.choices[0].message.content;

    // Parse JSON safely
    let parsedFeedback = {};
    let aiBandScore = 6.0;
    
    try {
      parsedFeedback = JSON.parse(aiResponse);
      
      if (!parsedFeedback?.scores || !parsedFeedback?.feedback) {
        console.warn("⚠️ Invalid AI response structure detected from GPT.");
      }

      aiBandScore = parsedFeedback?.scores?.overall || 6.0;
    } catch (parseError) {
      console.error("Failed to parse GPT JSON response:", parseError);
    }

    // 3️⃣ Save AI evaluation
    const { data, error: updateError } = await supabase
      .from("speaking_sessions")
      .update({
        ai_band_score: aiBandScore,
        ai_feedback: parsedFeedback?.feedback?.summary || aiResponse,
        ai_detailed_feedback: parsedFeedback,
        evaluated_at: new Date().toISOString(),
        status: "evaluated"
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: "AI evaluation completed",
      session: data,
      responses
    });
  } catch (err) {
    console.error("AI Evaluation Error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export const teacherReviewSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { teacherBandScore, teacherFeedback } = req.body;

    if (!teacherBandScore || !teacherFeedback) {
      return res.status(400).json({
        success: false,
        message: "Teacher band score and feedback are required"
      });
    }

    // Update ONLY teacher fields
    const { data, error } = await supabase
      .from("speaking_sessions")
      .update({
        teacher_band_score: teacherBandScore,
        teacher_feedback: teacherFeedback
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    return res.json({
      success: true,
      message: "Teacher review saved",
      data
    });
  } catch (err) {
    console.error("Teacher review error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
