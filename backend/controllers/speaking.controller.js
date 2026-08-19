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
        ai_detailed_feedback,
        teacher_band_score,
        teacher_feedback,
        teacher_fluency_score,
        teacher_lexical_score,
        teacher_grammar_score,
        teacher_pronunciation_score,
        reviewed_at,
        profiles (
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
    if (session.status !== "evaluated" && session.status !== "reviewed") {
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
          ai_detailed_feedback: session.ai_detailed_feedback,
          started_at: session.started_at,
          completed_at: session.completed_at,
          teacher_band_score: session.teacher_band_score,
          teacher_feedback: session.teacher_feedback,
          teacher_fluency_score: session.teacher_fluency_score,
          teacher_lexical_score: session.teacher_lexical_score,
          teacher_grammar_score: session.teacher_grammar_score,
          teacher_pronunciation_score: session.teacher_pronunciation_score,
          reviewed_at: session.reviewed_at
        },
        student: session.profiles,
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

    // 🚀 Execute all transcriptions concurrently for lightning-fast speeds!
    const transcriptionResults = await Promise.all(responses.map(async (response) => {
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

        return {
          duration: response.audio_duration || 0,
          wordsCount: wordsCount,
          transcriptPart: `\n--- PART ${response.speaking_questions?.part || 'Unknown'} ---\nQUESTION:\n${response.speaking_questions?.question_text || 'No question text provided'}\n\nSTUDENT RESPONSE:\n${transcriptText}\n\n`
        };
      } catch (err) {
        // Wrap the error with context so the frontend gets an exact reason why it failed
        throw new Error(`Failed transcribing Part ${response.speaking_questions?.part || '?'}: ${err.message}`);
      } finally {
        // Delete temp file regardless of success or failure
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    }));

    // Assemble results in chronological order
    for (const result of transcriptionResults) {
      totalDuration += result.duration;
      totalSessionWords += result.wordsCount;
      fullTranscript += result.transcriptPart;
    }

    // 4️⃣ TRANSCRIPT FALLBACK PROTECTION (Protect GPT Cost)
    if (totalSessionWords < 10) {
      return res.status(400).json({
        success: false,
        message: "We couldn’t detect enough speech for evaluation. Please try again."
      });
    }

    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      // Removed max_tokens to allow full-length analysis
      messages: [
        {
          role: "system",
          content: `
You are an IELTS linguistic analysis engine.

Analyze deeply:
- grammar mistakes
- vocabulary issues
- fluency problems
- coherence issues

Return ONLY JSON:

{
  "grammar_errors": [
    {
      "mistake": "...",
      "correction": "...",
      "explanation": "..."
    }
  ],
  "vocabulary_issues": [
    {
      "original": "...",
      "improved": "...",
      "reason": "..."
    }
  ],
  "fluency_issues": [],
  "coherence_issues": [],
  "estimated_level": ""
}
`
        },
        {
          role: "user",
          content: fullTranscript
        }
      ]
    });

    const analysisData = JSON.parse(
      analysis.choices[0].message.content
    );

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.3,
      // Removed max_tokens to allow full-length generation
      messages: [
        {
          role: "system",
          content: `
You are a certified IELTS Speaking Examiner.

Below is a student's IELTS Speaking response and the question they answered.

Your task is to generate a COMPLETE evaluation + learning feedback system.

CRITICAL INSTRUCTIONS FOR YOUR EVALUATION:
- Provide better reasoning and deeper explanations for your scores and corrections.
- Offer a more nuanced evaluation of the student's actual linguistic abilities.
- Maintain stronger consistency with the official IELTS grading rubrics.
- Keep your outputs considerable and manageable (highly detailed, but strictly structured to avoid JSON truncation).
- LIBERAL SCORING BIAS: Make the evaluation liberal. Under no circumstances should you give a band score below 6.0 in any of the individual criteria or overall (6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0 are the only allowed scores). Even if the student's response is extremely weak, short, or has major errors, do not score it below 6.0 in fluency, lexical, grammar, pronunciation, or overall.

-------------------------------------
SECTION 1: IELTS BAND EVALUATION
-------------------------------------

Evaluate strictly based on official IELTS criteria, but with a liberal calibration:
- Fluency and Coherence (Minimum score is 6.0)
- Lexical Resource (Minimum score is 6.0)
- Grammatical Range and Accuracy (Minimum score is 6.0)
- Pronunciation (Minimum score is 6.0)
- Overall Band Score (Minimum score is 6.0)

For EACH:
- Give band score (6.0–9.0, allow .5)
- Give detailed explanation using IELTS descriptors

Then provide:
- Overall Band Score (rounded to .5)
- Summary paragraph
- Pacing and Hesitation: Provide specific feedback on the student's pacing, pauses, and hesitation.

-------------------------------------
SECTION 2: LANGUAGE ERRORS
-------------------------------------

Identify:
- grammar mistakes
- awkward phrasing
- unnatural expressions

For each:
- original
- correction
- explanation

-------------------------------------
SECTION 3: IDEAL ANSWERS
-------------------------------------

For EVERY SINGLE question the student answered in the transcript, rewrite their exact response into a full-length Band 7+ level ideal answer.
Preserve their original meaning but elevate the vocabulary, grammar, and coherence.

Return an array containing an object for each question answered:
- question (the exact question asked)
- ideal_answer (the full-length rewritten answer)

-------------------------------------
SECTION 4: PERFORMANCE ANALYTICS & DIAGNOSTICS
-------------------------------------

Analyze transcript deeply and return:
- filler_words_count (e.g. um, uh, like)
- repetitions_count
- long_pauses_count (>2 seconds)
- words_per_minute (estimate)
- fluency_observation (short explanation)

Also include the following diagnostic blocks:
A. Fluency Diagnosis:
   - Identify whether pauses are "Search Pauses" (searching for language/vocabulary) or "Content Pauses" (thinking about ideas/arguments).
   - Recommend 2-3 specific buying-time phrases to maintain fluency.
B. Pronunciation Syllable Stress Audit:
   - Identify 2-3 mispronounced words or words with incorrect syllable stress.
   - Explain the correct syllable to stress.
C. Cohesion Audit:
   - Identify any transition words or linking phrases that the student repeated too often.
   - Suggest 2-3 sophisticated alternatives.
D. Bottleneck Analysis:
   - Identify the single main criterion (e.g., Grammar or Vocabulary) that acts as a bottleneck preventing them from scoring higher, and state what they must focus on to break through.
E. Self-Correction Recognition:
   - Identify 1-2 instances where the student corrected their own grammar or pronunciation during speech, or note if they did not self-correct.

Also include the following Advanced Diagnostic blocks inside the JSON output format under analytics.advanced_diagnostics:
A. PEEL Argument Builder:
   - Take the student's raw response ideas for each question and map them into a structured PEEL argument (Point, Explanation, Example, Link) to show them how they could have expanded it logically.
B. Grammatical Diversity Matrix:
   - Checklist of key grammar structures (Conditionals, Passive Voice, Relative Clauses, Inversions, Modal Verbs) indicating if they were "used" or are "missing".
   - Give 1 grammar upgrade example showing an original simple sentence from the transcript transformed into an upgraded complex sentence.
C. Overused Word Tracker:
   - List basic, repetitive words used by the student, their counts, and high-level academic synonyms/alternatives.
D. Next Milestone Score Simulator:
   - Map their current speaking band, the target next milestone band (+0.5 higher), and 2-3 clear actionable milestones to achieve it.
E. Intonation/Rhythm Audit:
   - Provide thought-grouping advice, rhythmic pacing feedback, and a word-chunking comparative example.

-------------------------------------
SECTION 5: VOCABULARY ENHANCEMENT
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
SECTION 6: STRENGTHS & IMPROVEMENTS
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
- You are STRICT.
- Do NOT inflate IELTS scores beyond 9.0.
- Individual and overall scores MUST be 6.0 or higher.

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
    "fluency_note": "...",
    "fluency_diagnosis": {
      "pause_type_distribution": "...",
      "buying_time_recommendations": ["...", "..."]
    },
    "pronunciation_audit": [
      {
        "word": "...",
        "detected_error": "...",
        "syllable_stress_tip": "..."
      }
    ],
    "cohesion_audit": {
      "overused_linkers": ["...", "..."],
      "suggested_alternatives": ["...", "..."]
    },
    "bottleneck_analysis": {
      "limiting_criteria": "...",
      "key_actionable_focus": "..."
    },
    "self_correction_log": [
      {
        "original_error": "...",
        "corrected_to": "...",
        "outcome": "..."
      }
    ],
    "advanced_diagnostics": {
      "peel_argument_builder": [
        {
          "question": "...",
          "student_idea": "...",
          "peel_structure": {
            "point": "...",
            "explanation": "...",
            "example": "...",
            "link": "..."
          }
        }
      ],
      "grammatical_diversity_matrix": {
        "checklist": [
          {
            "structure_type": "...",
            "count": number,
            "status": "..."
          }
        ],
        "grammar_upgrade_example": {
          "original_simple_sentence": "...",
          "upgraded_complex_sentence": "...",
          "structure_type_used": "..."
        }
      },
      "overused_word_tracker": [
        {
          "word": "...",
          "frequency": number,
          "suggested_alternatives": ["...", "..."]
        }
      ],
      "score_milestone_simulator": {
        "current_band": number,
        "next_milestone_band": number,
        "actionable_steps": ["...", "..."]
      },
      "intonation_rhythm_audit": {
        "thought_grouping_advice": "...",
        "rhythmic_pacing_note": "...",
        "word_chunking_example": {
          "problematic_chunk": "...",
          "correct_chunk": "..."
        }
      }
    }
  },
  "errors": [
    {
      "original": "...",
      "correction": "...",
      "explanation": "..."
    }
  ],
  "ideal_answers": [
    {
      "question": "...",
      "ideal_answer": "..."
    }
  ],
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
  "improvements": ["...", "..."],
  "level": "..."
}
``
        },
        {
          role: "user",
          content: JSON.stringify({
            transcript: fullTranscript,
            analysis: analysisData
          })
        }
      ]
    });

    const aiResponse = completion.choices[0].message.content;

    // Parse JSON safely
    let parsedFeedback = {};
    let aiBandScore = 6.0;
    
    try {
      const cleanedContent = aiResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      console.log("RAW GPT:", cleanedContent);

      parsedFeedback = JSON.parse(cleanedContent);
      
      if (!parsedFeedback?.scores || !parsedFeedback?.feedback) {
        console.warn("⚠️ Invalid AI response structure detected from GPT.");
      }

      aiBandScore = parsedFeedback?.scores?.overall || 6.0;
    } catch (parseError) {
      console.error("GPT JSON PARSE ERROR:", parseError);
      console.error("RAW GPT RESPONSE:", aiResponse);
      
      // Graceful fallback instead of completely crashing the evaluation
      parsedFeedback = {
        scores: { overall: 6.0, fluency: 6.0, lexical: 6.0, grammar: 6.0, pronunciation: 6.0 },
        feedback: { 
          summary: "We successfully analyzed your audio, but the AI formatting was slightly off. Here is the raw output:\\n\\n" + aiResponse 
        },
        errors: [],
        ideal_answers: [],
        vocabulary: { recommendations: [], topic_words: [], phrases: [] },
        strengths: [],
        improvements: [],
        level: "Intermediate"
      };
      aiBandScore = 6.0;
    }

    // 3️⃣ Save AI evaluation
    const { data, error: updateError } = await supabase
      .from("speaking_sessions")
      .update({
        ai_band_score: aiBandScore,
        ai_feedback: parsedFeedback?.feedback?.summary || aiResponse,
        student_level: aiBandScore >= 7 
          ? "Advanced" 
          : aiBandScore >= 5.5 
          ? "Intermediate" 
          : "Beginner",
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
      message: err.message,
      errorDetails: err.stack // Sends stack trace to the browser network/console tab for easier debugging
    });
  }
};

export const teacherReviewSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      teacherBandScore,
      teacherFluencyScore,
      teacherLexicalScore,
      teacherGrammarScore,
      teacherPronunciationScore,
      teacherFeedback
    } = req.body;

    if (!teacherBandScore || !teacherFeedback || !teacherFluencyScore || !teacherLexicalScore || !teacherGrammarScore || !teacherPronunciationScore) {
      return res.status(400).json({
        success: false,
        message: "All teacher scores and feedback are required."
      });
    }

    const updateData = {
      teacher_band_score: teacherBandScore,
      teacher_fluency_score: teacherFluencyScore,
      teacher_lexical_score: teacherLexicalScore,
      teacher_grammar_score: teacherGrammarScore,
      teacher_pronunciation_score: teacherPronunciationScore,
      teacher_feedback: teacherFeedback,
      reviewed_at: new Date().toISOString(),
      status: "reviewed"
    };

    const { data, error } = await supabase
      .from("speaking_sessions")
      .update(updateData)
      .eq("id", sessionId)
      .select()
      .single();

    if (error || !data) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Teacher review saved successfully.",
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

export const markSessionAsReviewed = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from("speaking_sessions")
      .update({
        status: "reviewed",
        reviewed_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Session not found or could not be updated."
      });
    }

    return res.json({
      success: true,
      message: "Session marked as reviewed.",
      data
    });
  } catch (err) {
    console.error("Mark as reviewed error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('speaking_sessions')
      .select(`
        id,
        created_at,
        status,
        reviewed_at,
        profiles (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50); // Fetch up to 50 recent student attempts

    if (error) throw error;

    const activities = data.map(session => ({
      id: session.id,
      studentName: session.profiles?.full_name || 'Unknown Student',
      description: `Completed a new speaking attempt.`,
      timestamp: new Date(session.created_at).toLocaleString(),
      type: session.status === 'completed' ? 'feedback_pending' : 'new_attempt',
      actionRequired: session.status === 'completed' || session.status === 'evaluated',
      reviewed_at: session.reviewed_at,
    }));

    return res.status(200).json({
      success: true,
      data: activities,
    });

  } catch (err) {
    console.error("Error fetching recent activities:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activities."
    });
  }
};
