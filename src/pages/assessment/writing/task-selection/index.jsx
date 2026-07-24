import React from "react";
import useTaskSelection from "./hooks/useTaskSelection";
import AppIcon from "../../../../components/AppIcon";
import Button from "../../../../components/ui/Button";

const DIFFICULTY_OPTIONS = [
  { id: "all", label: "All Difficulties" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const QUESTION_TYPE_OPTIONS = [
  { id: "all", label: "All Types" },
  { id: "bar_chart", label: "Bar Graph" },
  { id: "line_graph", label: "Line Graph" },
  { id: "pie_chart", label: "Pie Chart" },
  { id: "table", label: "Table" },
  { id: "map", label: "Map" },
  { id: "process", label: "Process" },
  { id: "cycle", label: "Cycle" },
];

const WritingTaskSelection = () => {
  const {
    loading,
    starting,
    error,
    clearError,
    difficulty,
    setDifficulty,
    questionType,
    setQuestionType,
    stats,
    availableCount,
    handleStartSession,
  } = useTaskSelection();

  // Find human-readable label for selected options
  const currentDifficultyLabel =
    DIFFICULTY_OPTIONS.find((d) => d.id === difficulty)?.label || "All";
  const currentTypeLabel =
    QUESTION_TYPE_OPTIONS.find((t) => t.id === questionType)?.label || "All";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Writing Task 1 — Selection
          </h1>
          <p className="text-muted-foreground mt-1 font-caption">
            Select your preferences to begin a timed Academic Task 1 writing test.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-semibold self-start md:self-auto">
          <AppIcon name="Award" size={16} />
          Academic Module
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AppIcon name="AlertCircle" size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-destructive hover:text-destructive/80 text-xs underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: Live Statistics Grid */}
      <div>
        <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <AppIcon name="Activity" size={20} className="text-primary" />
          Live Question Bank Statistics
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-card border border-border rounded-xl animate-pulse p-4"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Question Bank Total */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <AppIcon name="BookOpen" size={24} />
              </div>
              <div>
                <p className="text-xs font-caption text-muted-foreground uppercase tracking-wider">
                  Question Bank
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalActive}
                </p>
                <p className="text-xs text-muted-foreground">Active questions</p>
              </div>
            </div>

            {/* Question Types Count */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-secondary/20 rounded-lg text-secondary-foreground">
                <AppIcon name="PieChart" size={24} />
              </div>
              <div>
                <p className="text-xs font-caption text-muted-foreground uppercase tracking-wider">
                  Question Types
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.distinctTypesCount}
                </p>
                <p className="text-xs text-muted-foreground">Distinct types</p>
              </div>
            </div>

            {/* Time Limit */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-lg text-accent-foreground">
                <AppIcon name="Clock" size={24} />
              </div>
              <div>
                <p className="text-xs font-caption text-muted-foreground uppercase tracking-wider">
                  Time Limit
                </p>
                <p className="text-2xl font-bold text-foreground">20 Min</p>
                <p className="text-xs text-muted-foreground">Task 1 Standard</p>
              </div>
            </div>

            {/* Bank Status */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                <AppIcon name="Database" size={24} />
              </div>
              <div>
                <p className="text-xs font-caption text-muted-foreground uppercase tracking-wider">
                  Bank Status
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalActive} / {stats.totalQuestions}
                </p>
                <p className="text-xs text-muted-foreground">Active / Total</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Live Filters */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
          <AppIcon name="Filter" size={20} className="text-primary" />
          Filter Selection
        </h2>

        {/* Difficulty Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Difficulty Level
          </label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => {
              const active = difficulty === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDifficulty(opt.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Type Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Question Type
          </label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPE_OPTIONS.map((opt) => {
              const active = questionType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setQuestionType(opt.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* STEP 3 & STEP 4: Question Preview & Start Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Question Preview Box */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                <AppIcon name="Eye" size={20} className="text-primary" />
                Question Selection Preview
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-muted rounded-full text-muted-foreground">
                Selection Mode: Random
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground block">
                  Available Questions
                </span>
                <span className="text-xl font-bold text-foreground">
                  {availableCount}
                </span>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground block">
                  Time Limit
                </span>
                <span className="text-xl font-bold text-foreground">
                  20 Minutes
                </span>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground block">
                  Difficulty
                </span>
                <span className="text-sm font-semibold text-foreground truncate block">
                  {currentDifficultyLabel}
                </span>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground block">
                  Question Type
                </span>
                <span className="text-sm font-semibold text-foreground truncate block">
                  {currentTypeLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {availableCount > 0
                ? `${availableCount} question(s) match your current criteria.`
                : "No questions match your current filter selection."}
            </span>
            <span className="font-semibold text-foreground">Academic Task 1</span>
          </div>
        </div>

        {/* Start Button Box */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-heading font-semibold text-foreground mb-2">
              Ready to Practice?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Clicking below will select a random Task 1 question matching your
              filters, initialize your test session, and start the timer.
            </p>
          </div>

          <Button
            size="xl"
            variant="default"
            fullWidth
            loading={starting}
            disabled={loading || starting || availableCount === 0}
            onClick={handleStartSession}
            iconName={starting ? null : "Play"}
            iconPosition="right"
            className="shadow-md font-bold text-base"
          >
            {starting ? "Initializing Test..." : "Start Task 1 Test"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WritingTaskSelection;