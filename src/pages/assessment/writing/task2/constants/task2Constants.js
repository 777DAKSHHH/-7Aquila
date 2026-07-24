/**
 * Writing Task 2 Centralized Constants
 * Single source of truth for default fallback values and metadata definitions.
 */

export const TASK2_DEFAULTS = {
  TIME_LIMIT_MINUTES: 40,
  TIME_LIMIT_SECONDS: 2400,
  MIN_WORD_COUNT: 250,
  MODULE: "Academic / General",
  DEFAULT_TITLE: "Writing Task 2 Essay",
  DEFAULT_INSTRUCTIONS:
    "You should spend about 40 minutes on this task. Write about the following topic. Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.",
  INCOMPLETE_DATA_MESSAGE:
    "Question details are incomplete. Please contact your instructor.",
};

export const ESSAY_TYPE_LABELS = {
  opinion: "Opinion / Agree or Disagree",
  discussion: "Discuss Both Sides",
  advantage_disadvantage: "Advantages & Disadvantages",
  problem_solution: "Problem & Solution",
  double_question: "Double Question",
  general: "Essay",
};

export const DIFFICULTY_BADGES = {
  easy: { label: "Easy", variant: "success" },
  medium: { label: "Medium", variant: "warning" },
  hard: { label: "Hard", variant: "danger" },
};
