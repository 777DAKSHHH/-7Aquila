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

/**
 * Target JSON Schema for AI Providers
 */
export const TARGET_EVALUATION_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "IELTSTask1EvaluationResult",
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
  },
};

/**
 * System Prompt Builder
 */
export const buildSystemPrompt = () => {
  return `You are a Senior Certified IELTS Examiner for Academic Writing Task 1.
Your task is to evaluate a candidate's Task 1 report response strictly according to official IELTS assessment criteria.

ASSESSMENT CRITERIA:
1. Task Achievement (TA): Response to prompt, overview of main features, accurate data points.
2. Coherence & Cohesion (CC): Logical organization, paragraphing, cohesive devices, referencing.
3. Lexical Resource (LR): Range and precision of vocabulary, collocation, reporting style, spelling accuracy.
4. Grammatical Range & Accuracy (GRA): Variety of complex structures, error-free sentences, punctuation.

SCORING RULES:
- Evaluate objectively based only on the provided prompt and candidate response.
- Assign individual band scores (0.0 to 9.0 in half-band increments: e.g. 5.5, 6.0, 6.5, 7.0) for each criterion.
- Calculate overall band by averaging the 4 criteria and rounding according to IELTS standards.
- Word count recommendation for Task 1 is at least 150 words.

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
}) => {
  return `EVALUATION REQUEST - IELTS ACADEMIC WRITING TASK 1

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

INSTRUCTION: Evaluate the candidate response above according to official IELTS Academic Writing Task 1 criteria and output the result strictly as a valid JSON object matching the target schema.`;
};

export const PromptTemplates = {
  PROMPT_VERSIONS,
  EVALUATION_CONFIG_DEFAULTS,
  IELTS_TASK1_RUBRIC,
  TARGET_EVALUATION_SCHEMA,
  buildSystemPrompt,
  buildUserPrompt,
};
