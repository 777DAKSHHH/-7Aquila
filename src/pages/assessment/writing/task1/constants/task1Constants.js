/**
 * Writing Task 1 Centralized Constants
 * Single source of truth for default fallback values and metadata definitions.
 */

export const TASK1_DEFAULTS = {
  TIME_LIMIT_MINUTES: 20,
  TIME_LIMIT_SECONDS: 1200,
  MIN_WORD_COUNT: 150,
  MODULE: "Academic",
  DEFAULT_TITLE: "Academic Writing Task 1",
  DEFAULT_INSTRUCTIONS:
    "You should spend about 20 minutes on this task. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words.",
  IMAGE_FALLBACK_TEXT: "Question image unavailable.",
  INCOMPLETE_DATA_MESSAGE:
    "Question details are incomplete. Please contact your instructor.",
};

export const QUESTION_TYPE_LABELS = {
  bar_chart: "Bar Graph",
  line_graph: "Line Graph",
  pie_chart: "Pie Chart",
  table: "Table",
  map: "Map",
  process: "Process",
  cycle: "Cycle",
  general: "Academic Chart",
};

export const DIFFICULTY_BADGES = {
  easy: { label: "Easy", variant: "success" },
  medium: { label: "Medium", variant: "warning" },
  hard: { label: "Hard", variant: "danger" },
};
