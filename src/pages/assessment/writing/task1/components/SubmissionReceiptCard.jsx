import React, { useState } from "react";
import AppIcon from "../../../../../components/AppIcon";
import Button from "../../../../../components/ui/Button";

/**
 * SubmissionReceiptCard Component (Sprint 3 Confirmation & Sprint 4 Complete - Phases 1 to 8)
 *
 * Responsibilities:
 * - Renders official IELTS CBT submission receipt upon session completion.
 * - Displays Session ID, Question Code, Submission Timestamp, Final Word Count, Time Taken, and Status.
 * - Displays Evaluation Orchestrator & Prompt Package details.
 * - Displays AI Provider Engine metrics (Latency, Tokens, Provider).
 * - Displays Response Processing Engine normalized evaluation object.
 * - Displays Scoring Engine official band score & IELTS rounding calculation.
 * - Displays Feedback Generation Engine structured educational feedback & action plan.
 * - Displays Evaluation Persistence Engine database write status.
 * - Displays Evaluation Result Builder consumer view models (Student Report, Faculty Audit, Analytics, History).
 * - Read-only protection: prevents editing completed sessions.
 * - Rocket UI design matching platform standards.
 */
const SubmissionReceiptCard = ({
  receiptData,
  isPreparedForEval = false,
  isEvaluating = false,
  evaluationStatus = "idle",
  evaluationData = null,
  onStartEvaluation,
  onReturnToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState("student");

  if (!receiptData) return null;

  const {
    sessionId = "",
    questionCode = "WT1-CBT",
    questionTitle = "Writing Task 1 Examination",
    submittedAt = new Date().toISOString(),
    finalWordCount = 0,
    timeTakenFormatted = "00:00",
    status = "completed",
  } = receiptData;

  const formattedDate = new Date(submittedAt).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const rawProviderRes = evaluationData?.rawProviderResponse;
  const evalPackage = evaluationData?.evaluationPackage;
  const normalizedEval = evaluationData?.normalizedEvaluation;
  const officialScore = evaluationData?.officialScore;
  const feedback = evaluationData?.structuredFeedback;
  const persistedRec = evaluationData?.persistedRecord;
  const evalResults = evaluationData?.evaluationResults;

  const displayStatus =
    evaluationStatus === "completed" && officialScore
      ? `EVALUATION COMPLETE (BAND ${officialScore.overallBand.toFixed(1)})`
      : isEvaluating
      ? "BUILDING RESULT MODELS..."
      : isPreparedForEval
      ? "READY FOR EVALUATION"
      : status.toUpperCase();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Subtle Background Glow Accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Success Icon & Header Banner */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-emerald-500/15 text-emerald-600 rounded-full mx-auto flex items-center justify-center border-2 border-emerald-500/30 shadow-inner animate-bounce-short">
            <AppIcon name="CheckCheck" size={40} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground">
              Writing Task 1 Complete
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Your response has been securely persisted, validated, finalized, scored, and prepared for presentation.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <AppIcon name="ShieldCheck" size={14} />
            Status: {displayStatus}
          </div>
        </div>

        {/* Official Submission Receipt Details Table */}
        <div className="bg-muted/30 border border-border/80 rounded-xl p-6 space-y-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <AppIcon name="Receipt" size={15} className="text-primary" />
              Official Examination Receipt
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              ROCKET CBT ENGINE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-caption">
            {/* Session UUID */}
            <div className="space-y-1 bg-card p-3 rounded-lg border border-border/40">
              <span className="text-muted-foreground">Session Reference</span>
              <p className="font-mono font-bold text-foreground truncate">
                {sessionId}
              </p>
            </div>

            {/* Question Code */}
            <div className="space-y-1 bg-card p-3 rounded-lg border border-border/40">
              <span className="text-muted-foreground">Question Code</span>
              <p className="font-mono font-bold text-primary">
                {questionCode}
              </p>
            </div>

            {/* Submission Timestamp */}
            <div className="space-y-1 bg-card p-3 rounded-lg border border-border/40">
              <span className="text-muted-foreground">Finalized Timestamp</span>
              <p className="font-medium text-foreground">{formattedDate}</p>
            </div>

            {/* Final Word Count */}
            <div className="space-y-1 bg-card p-3 rounded-lg border border-border/40">
              <span className="text-muted-foreground">Final Word Count</span>
              <p className="font-mono font-bold text-emerald-600">
                {finalWordCount} Words
              </p>
            </div>

            {/* Time Elapsed */}
            <div className="space-y-1 bg-card p-3 rounded-lg border border-border/40">
              <span className="text-muted-foreground">Time Duration</span>
              <p className="font-mono font-bold text-foreground">
                {timeTakenFormatted}
              </p>
            </div>

            {/* Question Title */}
            <div className="space-y-1 bg-card p-3 rounded-lg border border-border/40">
              <span className="text-muted-foreground">Task Title</span>
              <p className="font-medium text-foreground truncate">
                {questionTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Sprint 4 Phase 8 Evaluation Result Builder Consumer View Models Preview */}
        {evalResults && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <AppIcon name="Layers" size={16} />
                Consumer View Models (Phase 8 Result Builder)
              </span>

              {/* View Model Navigation Tabs */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("student")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === "student"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Student Report
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("faculty")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === "faculty"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Faculty Audit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("analytics")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === "analytics"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Analytics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    activeTab === "history"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  History
                </button>
              </div>
            </div>

            {/* TAB 1: Student Report View Model */}
            {activeTab === "student" && evalResults.studentReport && (
              <div className="space-y-3 text-xs font-caption animate-in fade-in duration-200">
                <div className="flex items-center justify-between bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/30">
                  <span className="font-bold text-emerald-600">Student Overall Score</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-sm">
                    Band {evalResults.studentReport.overallBand?.toFixed(1)}
                  </span>
                </div>
                <div className="bg-muted/20 p-3 rounded-lg border border-border/40 leading-relaxed">
                  <span className="font-bold text-primary block mb-1">Examiner Summary</span>
                  <p>{evalResults.studentReport.summary}</p>
                </div>
              </div>
            )}

            {/* TAB 2: Faculty Audit View Model */}
            {activeTab === "faculty" && evalResults.facultyReport && (
              <div className="space-y-3 text-xs font-mono animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/30 p-2.5 rounded border border-border/40 space-y-0.5">
                    <span className="text-muted-foreground block text-[10px]">PROVIDER / MODEL</span>
                    <span className="font-bold text-foreground">
                      {evalResults.facultyReport.auditMetadata?.provider?.toUpperCase()} • {evalResults.facultyReport.auditMetadata?.model}
                    </span>
                  </div>
                  <div className="bg-muted/30 p-2.5 rounded border border-border/40 space-y-0.5">
                    <span className="text-muted-foreground block text-[10px]">PROMPT / RUBRIC</span>
                    <span className="font-bold text-foreground">
                      Prompt {evalResults.facultyReport.auditMetadata?.promptVersion} • Rubric {evalResults.facultyReport.auditMetadata?.rubricVersion}
                    </span>
                  </div>
                </div>
                <div className="bg-muted/30 p-2.5 rounded border border-border/40 space-y-0.5">
                  <span className="text-muted-foreground block text-[10px]">RAW MATHEMATICAL AVERAGE</span>
                  <span className="font-bold text-primary">
                    {evalResults.facultyReport.auditMetadata?.rawAverage?.toFixed(3)}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: Analytics Payload View Model */}
            {activeTab === "analytics" && evalResults.analyticsPayload && (
              <div className="space-y-2 text-xs font-mono animate-in fade-in duration-200">
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-card p-2 rounded border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">WORD COUNT</span>
                    <span className="font-bold text-foreground">{evalResults.analyticsPayload.wordCount} words</span>
                  </div>
                  <div className="bg-card p-2 rounded border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">TIME TAKEN</span>
                    <span className="font-bold text-foreground">{evalResults.analyticsPayload.timeTakenSeconds}s</span>
                  </div>
                  <div className="bg-card p-2 rounded border border-border/40">
                    <span className="text-muted-foreground block text-[10px]">API LATENCY</span>
                    <span className="font-bold text-foreground">{evalResults.analyticsPayload.providerLatencyMs}ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: History Record View Model */}
            {activeTab === "history" && evalResults.historyRecord && (
              <div className="space-y-2 text-xs font-mono animate-in fade-in duration-200">
                <div className="bg-card p-3 rounded-lg border border-border/40 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-primary block">{evalResults.historyRecord.questionCode}</span>
                    <span className="text-muted-foreground text-[11px]">{evalResults.historyRecord.questionTitle}</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/15 text-emerald-600 font-bold rounded-lg border border-emerald-500/30">
                    Band {evalResults.historyRecord.overallBand?.toFixed(1)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Evaluation Orchestrator Progress Banner */}
        {isEvaluating && (
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-3 animate-pulse">
            <AppIcon name="Cpu" size={20} className="animate-spin text-primary" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-primary">
                Evaluation Result Builder Active
              </p>
              <p className="text-muted-foreground">
                Assembling Student Report, Faculty Audit, Analytics Payload, and Practice History models...
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {onStartEvaluation && evaluationStatus !== "completed" && (
            <Button
              variant="default"
              size="lg"
              disabled={isEvaluating}
              onClick={onStartEvaluation}
              iconName={isEvaluating ? "Loader2" : "Zap"}
              className="font-bold px-8 shadow-md"
            >
              {isEvaluating ? "Building Result Models..." : "Run Complete AI Evaluation Pipeline"}
            </Button>
          )}

          <Button
            variant="outline"
            size="lg"
            onClick={onReturnToDashboard}
            iconName="ArrowLeft"
            className="font-bold px-6"
          >
            Back to Selection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SubmissionReceiptCard);
