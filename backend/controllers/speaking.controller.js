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

    const { data: { user }, error: authError } =
      await supabase.auth.getUser(authHeader);

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
Question (Part ${response.speaking_questions?.part}):
${response.speaking_questions.question_text}

Student Answer:
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
      messages: [
        {
          role: "system",
          content: `Below is an IELTS Speaking response given by a student.

Please evaluate the response strictly according to the official IDP IELTS Speaking band descriptors.

Assessment must be based on the following four criteria:

1. Fluency and Coherence
2. Lexical Resource
3. Grammatical Range and Accuracy
4. Pronunciation

For each criterion:

- Provide an estimated band score (from 0 to 9, in 0.5 increments where appropriate).
- Provide a clear explanation referring to the relevant band descriptor characteristics (such as flexibility, range, accuracy, hesitation, coherence, vocabulary control, pronunciation clarity, etc.).

Then:

- Provide an overall band score (rounded to the nearest 0.5).
- Provide a short summary paragraph explaining the overall performance.
- Provide 3-5 specific strengths demonstrated in the student's response (under the exact heading "Strengths").
- Provide 3-5 concise, practical suggestions for improvement (under the exact heading "Areas for improvement").

Important Instructions:

- If the student response does not address the question properly or is off-topic, clearly state this in your evaluation.
- Do NOT rewrite the student’s full response.
- Do NOT use bold, underline, highlighting, or special formatting.
- Do NOT refer to any sample answer.
- Base the evaluation only on the student’s spoken transcript.
- Maintain a professional examiner tone.
- Ensure the scoring aligns logically with the official IELTS Speaking descriptors (Bands 6–9).

Here is the student’s transcript:`
        },
        {
          role: "user",
          content: fullTranscript
        }
      ]
    });

    const aiResponse = completion.choices[0].message.content;

    // Extract band score safely (basic parsing)
    const bandMatch = aiResponse.match(/Overall Band Score:\s*(\d+(\.\d+)?)/i);
    const aiBandScore = bandMatch ? parseFloat(bandMatch[1]) : 6.0;
    const aiFeedback = aiResponse;

    // 3️⃣ Save AI evaluation
    const { data, error: updateError } = await supabase
      .from("speaking_sessions")
      .update({
        ai_band_score: aiBandScore,
        ai_feedback: aiFeedback,
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
