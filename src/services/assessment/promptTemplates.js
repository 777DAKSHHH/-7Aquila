/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * PROMPT TEMPLATES & IELTS RUBRIC CONFIGURATION
 *
 * Centralized, version-controlled definitions for:
 * - System Prompts
 * - User Prompt Builder Templates
 * - Official IELTS Writing Task 1 Assessment Rubric
 * - Target Evaluation JSON Schema
 * ==========================================================
 */

export const PROMPT_VERSIONS = {
  ENGINE_VERSION: "v1.0.0",
  PROMPT_VERSION: "v1.0.0",
  RUBRIC_VERSION: "v1.0.0",
  SCHEMA_VERSION: "v1.0.0",
};

/**
 * Logical Evaluation Settings (Provider Independent)
 */
export const EVALUATION_CONFIG_DEFAULTS = {
  temperature: 0.2,
  maxTokens: 2500,
  responseFormat: "json_object",
  reasoningLevel: "detailed",
};

/**
 * Official IELTS Writing Task 1 Rubric
 */
export const IELTS_TASK1_RUBRIC = {
  taskAchievement: {
    name: "Task Achievement (TA)",
    weight: 0.25,
    description: "Assesses how appropriately, accurately, and pleasantly the candidate fulfills the requirements in at least 150 words.",
    keyFactors: [
      "Fulfills requirements of the prompt.",
      "Presents clear overview of main trends, differences, or stages.",
      "Highlights and illustrates key features accurately with data/key points.",
      "Avoids speculation or ungrounded external information.",
    ],
  },
  coherenceAndCohesion: {
    name: "Coherence & Cohesion (CC)",
    weight: 0.25,
    description: "Assesses the clarity and smooth flow of information, paragraphing, and logical use of cohesive devices.",
    keyFactors: [
      "Organizes information and ideas logically with clear progression.",
      "Uses a range of cohesive devices appropriately without over/under-use.",
      "Presents clear central topic within each paragraph.",
      "Uses effective referencing and substitution.",
    ],
  },
  lexicalResource: {
    name: "Lexical Resource (LR)",
    weight: 0.25,
    description: "Assesses the range, precision, and accuracy of vocabulary used in describing visual data/trends.",
    keyFactors: [
      "Uses an adequate or wide range of vocabulary for Task 1 reporting.",
      "Uses less common lexical items with awareness of collocation and style.",
      "Produces rare or minimal spelling/word formation errors.",
      "Uses appropriate vocabulary for trends, comparisons, and percentages.",
    ],
  },
  grammaticalRangeAndAccuracy: {
    name: "Grammatical Range & Accuracy (GRA)",
    weight: 0.25,
    description: "Assesses the variety, complexity, and accuracy of sentence structures.",
    keyFactors: [
      "Uses a mix of simple and complex sentence structures.",
      "Produces a high proportion of error-free sentences.",
      "Demonstrates good control of grammar and punctuation.",
      "Accurately uses passive structures and complex comparisons where appropriate.",
    ],
  },
};

export const TARGET_EVALUATION_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "IELTSTaskEvaluationResult",
  type: "object",
  required: [
    "overall_band",
    "criterion_scores",
    "strengths",
    "weaknesses",
    "task_achievement_feedback",
    "coherence_feedback",
    "vocabulary_feedback",
    "grammar_feedback",
    "improvement_plan",
    "summary",
    "grammar_errors",
    "vocabulary_recommendations",
    "ideal_essay",
  ],
  properties: {
    overall_band: {
      type: "number",
      description: "Final overall IELTS band score (0.0 - 9.0 in half-band increments).",
    },
    criterion_scores: {
      type: "object",
      required: [
        "task_achievement",
        "coherence_and_cohesion",
        "lexical_resource",
        "grammatical_range_and_accuracy",
      ],
      properties: {
        task_achievement: { type: "number" },
        coherence_and_cohesion: { type: "number" },
        lexical_resource: { type: "number" },
        grammatical_range_and_accuracy: { type: "number" },
      },
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      description: "Key strengths identified in the response.",
    },
    weaknesses: {
      type: "array",
      items: { type: "string" },
      description: "Key areas needing improvement.",
    },
    task_achievement_feedback: { type: "string" },
    coherence_feedback: { type: "string" },
    vocabulary_feedback: { type: "string" },
    grammar_feedback: { type: "string" },
    improvement_plan: {
      type: "array",
      items: { type: "string" },
      description: "Actionable steps to reach higher band scores.",
    },
    summary: {
      type: "string",
      description: "Overall summary assessment by the examiner.",
    },
    grammar_errors: {
      type: "array",
      items: {
        type: "object",
        required: ["mistake", "correction", "explanation"],
        properties: {
          mistake: { type: "string" },
          correction: { type: "string" },
          explanation: { type: "string" }
        }
      },
      description: "List of specific grammar, punctuation, spelling or word order mistakes with explanations."
    },
    vocabulary_recommendations: {
      type: "array",
      items: {
        type: "object",
        required: ["instead_of", "better_alternatives", "reason", "example_sentence"],
        properties: {
          instead_of: { type: "string" },
          better_alternatives: {
            type: "array",
            items: { type: "string" }
          },
          reason: { type: "string" },
          example_sentence: { type: "string" }
        }
      },
      description: "Suggestions for replacing simple/repetitive words with academic vocabulary or precise collocations."
    },
    ideal_essay: {
      type: "string",
      description: "A complete rewrite of the student's response at a Band 7.5+ level, preserving their arguments but elevating vocabulary, cohesion, and grammar."
    }
  },
};

/**
 * System Prompt Builder
 */
export const buildSystemPrompt = (isTask2 = false) => {
  const taskTitle = isTask2 ? "Writing Task 2 (Essay)" : "Writing Task 1 (Academic Report)";
  const taskDesc = isTask2
    ? "Task Response (TR): Fulfilling the essay prompt, presenting a clear position, and developing ideas."
    : "Task Achievement (TA): Fulfilling the report requirements, presenting an overview, and illustrating key data.";
  
  return `You are a Senior Certified IELTS Examiner for ${taskTitle}.
Your task is to evaluate a candidate's response strictly according to official IELTS assessment criteria.

ASSESSMENT CRITERIA:
1. ${taskDesc}
2. Coherence & Cohesion (CC): Logical organization, paragraphing, cohesive devices, referencing.
3. Lexical Resource (LR): Range and precision of vocabulary, collocation, academic style, spelling accuracy.
4. Grammatical Range & Accuracy (GRA): Variety of complex structures, error-free sentences, punctuation control.

DETAILED FEEDBACK INSTRUCTIONS:
- You must deeply analyze the candidate's essay. Be strict and objective. Do not inflate scores.
- grammar_errors: Find specific spelling, grammar, punctuation, or word choices mistakes. Provide the original mistake, the correction, and a clear, certified examiner-style grammatical explanation.
- vocabulary_recommendations: Find repetitive, basic, or informal words. Suggest higher-level academic replacements and provide a clean example sentence using them.
- ideal_essay: Rewrite the candidate's response into a model Band 7.5+ response. Preserve their core arguments, opinion, and layout, but elevate the vocabulary, grammar, and coherence to the highest caliber.

OUTPUT FORMAT INSTRUCTION:
- You MUST return a single, strictly valid JSON object matching the requested schema.
- Do NOT include markdown code fences, explanatory text outside the JSON object, or commentary.
- Ensure all required JSON fields are fully populated.`;
};

/**
 * User Prompt Builder
 */
export const buildUserPrompt = ({
  questionTitle,
  questionPrompt,
  questionType,
  minWords = 150,
  essayText,
  wordCount,
  isTask2 = false,
}) => {
  const taskHeader = isTask2 ? "IELTS WRITING TASK 2 (ESSAY)" : "IELTS ACADEMIC WRITING TASK 1 (REPORT)";
  
  return `EVALUATION REQUEST - ${taskHeader}

QUESTION TITLE:
${questionTitle}

QUESTION INSTRUCTIONS / PROMPT:
${questionPrompt}

QUESTION TYPE:
${questionType}

MINIMUM REQUIRED WORDS:
${minWords}

CANDIDATE RESPONSE TEXT:
"${essayText}"

CANDIDATE RESPONSE METRICS:
- Word Count: ${wordCount} words
- Minimum Target Met: ${wordCount >= minWords ? "YES" : "NO"}

INSTRUCTION: Evaluate the candidate response above according to official IELTS criteria and output the result strictly as a valid JSON object matching the target schema.`;
};

export const PromptTemplates = {
  PROMPT_VERSIONS,
  EVALUATION_CONFIG_DEFAULTS,
  IELTS_TASK1_RUBRIC,
  TARGET_EVALUATION_SCHEMA,
  buildSystemPrompt,
  buildUserPrompt,
};
