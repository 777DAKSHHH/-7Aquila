import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReadingService } from "services/assessment/readingService";
import SplitPaneLayout from "../cbt/components/SplitPaneLayout";
import PassageViewer from "../cbt/components/PassageViewer";
import AppIcon from "components/AppIcon";
import Button from "components/ui/Button";

const ReadingResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [test, setTest] = useState(null);
  const [passages, setPassages] = useState([]);
  const [grading, setGrading] = useState(null);

  // Review mode UI states
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [activePassageIdx, setActivePassageIdx] = useState(0);
  const [selectedQuestionNum, setSelectedQuestionNum] = useState(1);
  const [contrastTheme, setContrastTheme] = useState("standard");

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        const res = await ReadingService.getReadingSessionResults(sessionId);
        if (res.success) {
          setSession(res.data.session);
          setTest(res.data.test);
          setPassages(res.data.passages || []);
          setGrading(res.data.grading);
        } else {
          setError(res.error || "Failed to retrieve results details.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadResults();
  }, [sessionId]);

  // Format seconds into HH:MM:SS or MM:SS
  const formatDuration = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  };

  // Helper to calculate score per passage
  const getPassageScore = (passageId) => {
    if (!grading || !grading.results) return { correct: 0, total: 0 };
    const passageQuestions = passages.find(p => p.id === passageId)?.questions || [];
    const qIds = passageQuestions.map(q => q.id);
    const passageResults = grading.results.filter(r => qIds.includes(r.questionId));
    const correct = passageResults.filter(r => r.isCorrect).length;
    return { correct, total: qIds.length };
  };

  // Dynamically inject green highlight tags around passage citations for answer review
  const getHighlightedPassageHtml = (passage) => {
    let html = passage.content_html || "";
    if (!passage.questions || passage.questions.length === 0) return html;

    passage.questions.forEach((q) => {
      if (q.citation_excerpt && q.citation_excerpt.trim().length > 3) {
        const excerpt = q.citation_excerpt.trim();
        // Escape regex special characters
        const escapedExcerpt = excerpt.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        
        try {
          // Highlight citations inside passage. We add a visual span tag.
          const regex = new RegExp(`(${escapedExcerpt})`, "gi");
          html = html.replace(
            regex,
            `<span class="bg-green-200/90 text-green-950 font-bold px-1 border-b-2 border-green-600 rounded" title="Question #${q.question_number} Citation (Answer: ${q.correct_answers.join('/')})">$1 <span class="text-[9px] uppercase tracking-wide bg-green-600 text-white rounded-full px-1.5 py-0.5 ml-1 select-none font-mono">Q${q.question_number}</span></span>`
          );
        } catch (err) {
          console.warn("Could not highlight excerpt:", excerpt, err);
        }
      }
    });

    return html;
  };

  // Theme support
  const getThemeClasses = () => {
    switch (contrastTheme) {
      case "dark":
        return "dark bg-slate-950 text-slate-50 border-slate-800";
      case "high-contrast":
        return "bg-black text-yellow-300 font-mono border-yellow-500 [&_input]:bg-black [&_input]:text-yellow-300 [&_input]:border-yellow-500 [&_select]:bg-black [&_select]:text-yellow-300 [&_select]:border-yellow-500 [&_button]:border-yellow-500 [&_header]:border-yellow-500 [&_footer]:border-yellow-500";
      case "standard":
      default:
        return "bg-background text-foreground";
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading detailed results analysis...</div>;
  }

  if (error || !session || !grading) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-card border border-destructive/20 rounded-xl p-8">
        <h2 className="text-xl font-heading font-bold text-destructive mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground text-sm mb-4">{error || "Results session data missing."}</p>
        <Button variant="outline" onClick={() => navigate("/assessment/reading/history")}>Back to History</Button>
      </div>
    );
  }

  const activePassage = passages[activePassageIdx];

  return (
    <div className={`w-full min-h-screen py-6 px-4 md:px-8 space-y-6 ${getThemeClasses()}`}>
      {/* 1. Header Toolbar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>Reading Test Results</span>
            <span>•</span>
            <span className="capitalize">{test?.test_type} Practice</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            {test?.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {isReviewMode && (
            <div className="flex items-center gap-1.5 bg-muted/40 border border-border p-1 rounded-xl text-xs mr-2">
              <button
                onClick={() => setContrastTheme("standard")}
                className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wide text-[10px] ${contrastTheme === "standard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                Standard
              </button>
              <button
                onClick={() => setContrastTheme("dark")}
                className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wide text-[10px] ${contrastTheme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                Dark
              </button>
              <button
                onClick={() => setContrastTheme("high-contrast")}
                className={`px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wide text-[10px] ${contrastTheme === "high-contrast" ? "bg-yellow-400 text-black border border-yellow-500 font-bold" : "text-muted-foreground hover:bg-muted"}`}
              >
                Contrast
              </button>
            </div>
          )}

          <Button
            variant={isReviewMode ? "outline" : "primary"}
            onClick={() => setIsReviewMode(!isReviewMode)}
          >
            <span className="flex items-center gap-2">
              <AppIcon name={isReviewMode ? "FileText" : "BookOpen"} size={16} />
              {isReviewMode ? "Close Review Mode" : "Review Passages & Citations"}
            </span>
          </Button>

          <Button variant="outline" onClick={() => navigate("/assessment/reading/history")}>
            Exit to History
          </Button>
        </div>
      </header>

      {/* 2. MAIN RESULTS DASHBOARD VIEW */}
      {!isReviewMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Metrics Overview */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Overall Performance
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Band score Display */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center space-y-1">
                  <span className="text-4xl font-bold text-primary font-mono block">
                    {grading.bandScore}
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                    IELTS Band Score
                  </span>
                </div>

                {/* Raw score Display */}
                <div className="bg-muted/40 border border-border rounded-xl p-5 text-center space-y-1">
                  <span className="text-3xl font-bold text-foreground font-mono block">
                    {grading.rawScore} <span className="text-sm text-muted-foreground">/ {grading.totalQuestions}</span>
                  </span>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">
                    Correct Answers
                  </span>
                </div>
              </div>

              {/* Time Spent */}
              <div className="border-t border-border pt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time Spent:</span>
                <span className="font-semibold font-mono text-foreground">
                  {formatDuration(session.time_spent_seconds)}
                </span>
              </div>
            </div>

            {/* Passage Breakdown Cards */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Passage Accuracy Breakdowns
              </h3>
              <div className="space-y-3">
                {passages.map((p, idx) => {
                  const score = getPassageScore(p.id);
                  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
                  return (
                    <div key={p.id} className="bg-muted/30 border border-border/60 rounded-xl p-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-foreground">Passage {p.passage_number}</h4>
                        <p className="text-xs text-muted-foreground max-w-[180px] truncate">{p.title}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <span className="text-sm font-mono font-bold text-foreground">{score.correct} / {score.total}</span>
                        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: 40 Question Diagnostics grid and review Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick 1-40 Question Status Grid */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Diagnostic Grid (Questions 1 - 40)
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {grading.results?.map((res) => (
                  <button
                    key={res.questionNumber}
                    onClick={() => {
                      setSelectedQuestionNum(res.questionNumber);
                      // Auto switch passage if they click a grid item and then toggle review mode
                      const pIdx = passages.findIndex(p => p.questions?.some(q => q.question_number === res.questionNumber));
                      if (pIdx !== -1) setActivePassageIdx(pIdx);
                    }}
                    className={`h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs border transition-all duration-base ${
                      selectedQuestionNum === res.questionNumber
                        ? "ring-2 ring-primary border-primary scale-105 z-10 font-black"
                        : ""
                    } ${
                      res.isCorrect
                        ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                        : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                    }`}
                  >
                    {res.questionNumber}
                  </button>
                ))}
              </div>
            </div>

            {/* Citations Card display for selected question */}
            {(() => {
              const qDetails = grading.results?.find(r => r.questionNumber === selectedQuestionNum);
              if (!qDetails) return null;

              return (
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-mono font-bold text-sm">
                        {qDetails.questionNumber}
                      </span>
                      <h4 className="text-md font-bold capitalize text-foreground">
                        {qDetails.questionType.replace("_", " ")} Question
                      </h4>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                      qDetails.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      <AppIcon name={qDetails.isCorrect ? "CheckCircle" : "XCircle"} size={14} />
                      {qDetails.isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  </div>

                  {/* Answers review list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-1">
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Your Answer:</span>
                      <span className="font-mono text-sm font-bold text-foreground block">
                        {Array.isArray(qDetails.userAnswer)
                          ? qDetails.userAnswer.join(", ")
                          : qDetails.userAnswer || "No Answer entered"}
                      </span>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1">
                      <span className="text-xs text-primary uppercase font-semibold">Accepted Correct Answer:</span>
                      <span className="font-mono text-sm font-bold text-primary block">
                        {qDetails.correctAnswers.join(" OR ")}
                      </span>
                    </div>
                  </div>

                  {/* Passage Text Citation Quote */}
                  {qDetails.citationExcerpt && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        Location Citation:
                      </h5>
                      <blockquote className="bg-green-50/50 border-l-4 border-green-500 pl-4 py-2 text-xs italic text-slate-700 dark:text-slate-300">
                        "{qDetails.citationExcerpt}"
                      </blockquote>
                    </div>
                  )}

                  {/* Explanation text */}
                  {qDetails.explanation && (
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        Explanation Note:
                      </h5>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {qDetails.explanation}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsReviewMode(true)}>
                      <span className="flex items-center gap-1.5">
                        <AppIcon name="MapPin" size={14} />
                        Locate in Passage
                      </span>
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* 3. INTERACTIVE REVIEW MODE VIEW (Split-Screen passages + graded questions) */
        <div className="space-y-4">
          {/* Selector Tabs for review passages */}
          <div className="flex items-center gap-1.5 bg-muted/40 border border-border p-1 rounded-xl max-w-sm mx-auto">
            {passages.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => {
                  setActivePassageIdx(idx);
                  // Default selected question index to the first question of this passage
                  if (p.questions && p.questions.length > 0) {
                    setSelectedQuestionNum(p.questions[0].question_number);
                  }
                }}
                className={`flex-1 px-4 py-1.5 rounded-lg text-xs font-semibold transition duration-base ${
                  activePassageIdx === idx
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Passage {p.passage_number}
              </button>
            ))}
          </div>

          <SplitPaneLayout
            leftPane={
              <PassageViewer
                title={`Passage ${activePassage.passage_number}: ${activePassage.title}`}
                subTitle={activePassage.sub_title}
                contentHtml={getHighlightedPassageHtml(activePassage)}
                textSize="medium"
              />
            }
            rightPane={
              <div className="p-6 md:p-8 space-y-6">
                <header className="border-b border-border pb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">Passage Questions Review</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    Green indicates citations highlighted in left passage
                  </span>
                </header>

                <div className="space-y-6">
                  {activePassage.questions?.map((q) => {
                    const result = grading.results?.find(r => r.questionId === q.id);
                    const qValue = session.user_answers[String(q.question_number)];
                    const isSelected = selectedQuestionNum === q.question_number;

                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuestionNum(q.question_number)}
                        className={`p-4 border rounded-xl space-y-3 cursor-pointer transition duration-base ${
                          isSelected
                            ? "ring-2 ring-primary border-primary bg-primary/5"
                            : "bg-card border-border/80 hover:bg-muted/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-bold mt-0.5 ${
                              result?.isCorrect
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}>
                              {q.question_number}
                            </span>
                            <div className="text-sm font-semibold text-foreground leading-normal">
                              {q.question_data?.text}
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                            result?.isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {result?.isCorrect ? "Correct" : "Incorrect"}
                          </span>
                        </div>

                        {/* Input answer details */}
                        <div className="pl-9 space-y-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Your Input:</span>{" "}
                            <span className="font-bold text-foreground font-mono">
                              {Array.isArray(qValue) ? qValue.join(", ") : qValue || "[No Answer]"}
                            </span>
                          </div>
                          <div>
                            <span className="text-primary font-medium">Accepted Correct:</span>{" "}
                            <span className="font-bold text-primary font-mono">
                              {q.correct_answers.join(" OR ")}
                            </span>
                          </div>
                        </div>

                        {/* Explanation block inside Review pane */}
                        {isSelected && q.explanation && (
                          <div className="pl-9 border-t border-border/40 pt-2.5 text-xs text-muted-foreground leading-relaxed animate-in fade-in duration-200">
                            <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};

export default ReadingResults;
