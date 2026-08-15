import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReadingService } from "services/assessment/readingService";
import SplitPaneLayout from "./components/SplitPaneLayout";
import PassageViewer from "./components/PassageViewer";
import QuestionPane from "./components/QuestionPane";
import ReadingFooterNav from "./components/ReadingFooterNav";
import HighlighterMenu from "./components/HighlighterMenu";
import StickyNote from "./components/StickyNote";
import AppIcon from "components/AppIcon";
import Button from "components/ui/Button";

const ReadingCbtTest = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Test state
  const [session, setSession] = useState(null);
  const [passages, setPassages] = useState([]);
  const [testMetadata, setTestMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Exam interface states
  const [activePassageIdx, setActivePassageIdx] = useState(0);
  const [activeQuestionNum, setActiveQuestionNum] = useState(1);
  const [userAnswers, setUserAnswers] = useState({});
  const [contrastTheme, setContrastTheme] = useState("standard"); // standard, dark, high-contrast
  const [selectionState, setSelectionState] = useState(null); // { text, range, node, position }
  const [stickyNotes, setStickyNotes] = useState([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [textSize, setTextSize] = useState("medium"); // small, medium, large
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Timer & Autosave states
  const [secondsRemaining, setSecondsRemaining] = useState(3600);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [autosaveStatus, setAutosaveStatus] = useState("saved"); // saved, saving, error
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for tracking timer and draft data
  const timerRef = useRef(null);
  const autosaveIntervalRef = useRef(null);
  const answersRef = useRef({});
  const flaggedRef = useRef([]);
  const timeSpentRef = useRef(0);

  // Sync refs with state for use in callbacks
  useEffect(() => {
    answersRef.current = userAnswers;
  }, [userAnswers]);

  useEffect(() => {
    flaggedRef.current = flaggedQuestions;
  }, [flaggedQuestions]);

  useEffect(() => {
    timeSpentRef.current = timeSpentSeconds;
  }, [timeSpentSeconds]);

  // 1. Initial Data Fetching
  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        // Fetch session
        const sessionRes = await ReadingService.getReadingSession(sessionId);
        if (!sessionRes.success) {
          setError(sessionRes.error || "Failed to load session details.");
          return;
        }

        const sessionData = sessionRes.data;
        if (sessionData.status === "completed") {
          navigate(`/assessment/reading/results/${sessionId}`, { replace: true });
          return;
        }

        setSession(sessionData);
        setUserAnswers(sessionData.user_answers || {});
        setFlaggedQuestions(sessionData.flagged_questions || []);
        setTimeSpentSeconds(sessionData.time_spent_seconds || 0);

        // Fetch test details (passages and nested questions)
        const testRes = await ReadingService.getReadingTestDetails(sessionData.reading_test_id);
        if (!testRes.success) {
          setError(testRes.error || "Failed to load passages and questions.");
          return;
        }

        setPassages(testRes.data.passages || []);
        setTestMetadata(testRes.data.test);

        // Set timer based on duration
        const duration = (testRes.data.test.duration_minutes || 60) * 60;
        const remaining = Math.max(0, duration - (sessionData.time_spent_seconds || 0));
        setSecondsRemaining(remaining);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTestData();
  }, [sessionId, navigate]);

  // 2. Timer Loop
  useEffect(() => {
    if (loading || error || !session) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });

      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, error, session]);

  // 3. Periodic Autosave Loop
  useEffect(() => {
    if (loading || error || !session) return;

    autosaveIntervalRef.current = setInterval(() => {
      triggerAutosave();
    }, 10000); // Autosave every 10 seconds

    return () => {
      if (autosaveIntervalRef.current) clearInterval(autosaveIntervalRef.current);
    };
  }, [loading, error, session]);

  // 4. Autosave Executor
  const triggerAutosave = async () => {
    setAutosaveStatus("saving");
    try {
      const res = await ReadingService.saveReadingDraft(sessionId, {
        userAnswers: answersRef.current,
        flaggedQuestions: flaggedRef.current,
        timeSpentSeconds: timeSpentRef.current
      });
      if (res.success) {
        setAutosaveStatus("saved");
      } else {
        setAutosaveStatus("error");
      }
    } catch (err) {
      console.error("Autosave draft failed:", err);
      setAutosaveStatus("error");
    }
  };

  // Text Selection Highlight & Notes Handlers
  const handleHighlight = (color) => {
    if (!selectionState) return;

    if (selectionState.range) {
      const range = selectionState.range;
      const span = document.createElement("span");
      span.className = "cbt-highlight rounded-sm px-0.5 transition-colors cursor-pointer select-text";
      span.style.backgroundColor = color;
      span.style.color = "black";
      
      try {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      } catch (err) {
        console.warn("Could not wrap text selection range:", err);
      }
      window.getSelection()?.removeAllRanges();
    } else if (selectionState.node) {
      selectionState.node.style.backgroundColor = color;
    }

    setSelectionState(null);
  };

  const handleClearHighlight = () => {
    if (!selectionState) return;

    if (selectionState.node) {
      const node = selectionState.node;
      const parent = node.parentNode;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
    }
    
    setSelectionState(null);
  };

  const handleAddStickyNote = () => {
    if (!selectionState) return;

    const newNote = {
      id: `note-${Date.now()}`,
      selectedText: selectionState.text,
      text: "",
      position: {
        x: selectionState.position.x - 100,
        y: selectionState.position.y - 20
      }
    };

    setStickyNotes((prev) => [...prev, newNote]);
    setSelectionState(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleNoteChange = (id, newText) => {
    setStickyNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, text: newText } : note))
    );
  };

  const handleNoteDelete = (id) => {
    setStickyNotes((prev) => prev.filter((note) => note.id !== id));
  };

  // 5. Answer Change Handler
  const handleAnswerChange = (qNum, val) => {
    setUserAnswers((prev) => ({
      ...prev,
      [String(qNum)]: val
    }));
    setAutosaveStatus("saving");
  };

  // 6. Review Flag Toggle Handler
  const handleToggleFlag = (qNum) => {
    setFlaggedQuestions((prev) =>
      prev.includes(qNum) ? prev.filter((n) => n !== qNum) : [...prev, qNum]
    );
    setAutosaveStatus("saving");
  };

  // 7. Active Question Selection (Palette callback)
  const handleQuestionSelect = (qNum) => {
    setActiveQuestionNum(qNum);
    // Find which passage this question number belongs to
    const passageIdx = passages.findIndex((p) =>
      p.questions?.some((q) => q.question_number === qNum)
    );
    if (passageIdx !== -1 && passageIdx !== activePassageIdx) {
      setActivePassageIdx(passageIdx);
    }
  };

  // 8. Test Finalization Submissions
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setIsSubmitModalOpen(false);
    
    // Clear intervals first
    if (timerRef.current) clearInterval(timerRef.current);
    if (autosaveIntervalRef.current) clearInterval(autosaveIntervalRef.current);

    try {
      const res = await ReadingService.submitReadingSession(sessionId, {
        userAnswers,
        flaggedQuestions,
        timeSpentSeconds,
        testType: testMetadata?.test_type || "academic"
      });

      if (res.success) {
        navigate(`/assessment/reading/results/${sessionId}`, { replace: true });
      } else {
        alert(res.error || "Submission failed. Please try again.");
        setIsSubmitting(false);
      }
    } catch (err) {
      alert("Submission Exception: " + err.message);
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    setIsSubmitting(true);
    try {
      await ReadingService.submitReadingSession(sessionId, {
        userAnswers: answersRef.current,
        flaggedQuestions: flaggedRef.current,
        timeSpentSeconds: timeSpentRef.current,
        testType: testMetadata?.test_type || "academic"
      });
      navigate(`/assessment/reading/results/${sessionId}`, { replace: true });
    } catch (err) {
      console.error("Auto submit failed:", err);
      navigate("/test-selection-dashboard", { replace: true });
    }
  };

  // Helper to format remaining timer: HH:MM:SS or MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");

    if (h > 0) {
      return `${h}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // Calculate stats for confirmation modal
  const answeredCount = Object.keys(userAnswers).filter(k => {
    const val = userAnswers[k];
    if (Array.isArray(val)) return val.length > 0;
    return val !== undefined && val !== null && String(val).trim() !== "";
  }).length;

  const totalQuestionsCount = passages.reduce((sum, p) => sum + (p.questions?.length || 0), 0) || 40;

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
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse py-8">
        <div className="h-16 bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-10 w-24 bg-muted rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-6 min-h-[500px]">
          <div className="bg-card border border-border rounded-xl p-6 h-full" />
          <div className="bg-card border border-border rounded-xl p-6 h-full" />
        </div>
      </div>
    );
  }

  if (error || !session || passages.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full mx-auto flex items-center justify-center">
          <AppIcon name="AlertTriangle" size={32} />
        </div>
        <h2 className="text-2xl font-bold">Failed to load Reading Test</h2>
        <p className="text-muted-foreground">{error || "Passages could not be loaded."}</p>
        <Button variant="outline" onClick={() => navigate("/assessment/reading/task-selection")}>
          Back to Selection
        </Button>
      </div>
    );
  }

  const activePassage = passages[activePassageIdx];

  return (
    <div className={`w-full flex flex-col min-h-screen pb-[88px] relative select-none ${getThemeClasses()}`}>
      {/* 1. Exam Header Panel */}
      <header className="sticky top-0 z-40 w-full bg-card border-b border-border shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Do you want to save draft progress and exit back to landing page?")) {
                triggerAutosave().then(() => navigate("/assessment/reading"));
              }
            }}
          >
            <AppIcon name="ArrowLeft" size={18} />
          </Button>
          <div>
            <h1 className="text-md md:text-lg font-heading font-semibold text-foreground">
              {testMetadata?.title || "IELTS Reading Test"}
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-primary">
                {testMetadata?.test_type}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <AppIcon name="Save" size={10} />
                {autosaveStatus === "saving" && "Saving..."}
                {autosaveStatus === "saved" && "Progress Saved"}
                {autosaveStatus === "error" && "Save Error - Retrying"}
              </span>
            </div>
          </div>
        </div>

        {/* Header Center: Passage Selector Tabs */}
        <div className="flex items-center gap-1 bg-muted/40 border border-border p-1 rounded-xl">
          {passages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setActivePassageIdx(idx)}
              className={`px-4 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-base ${
                activePassageIdx === idx
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Passage {p.passage_number}
            </button>
          ))}
        </div>

        {/* Header Right: Countdown Timer & Font/Contrast adjusters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 border-r border-border pr-4 mr-2">
            <button
              onClick={() => setContrastTheme("standard")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${contrastTheme === "standard" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              Standard
            </button>
            <button
              onClick={() => setContrastTheme("dark")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${contrastTheme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              Dark
            </button>
            <button
              onClick={() => setContrastTheme("high-contrast")}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${contrastTheme === "high-contrast" ? "bg-yellow-400 text-black border border-yellow-500 font-bold" : "text-muted-foreground hover:bg-muted"}`}
            >
              Contrast
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs border-r border-border pr-4 mr-2">
            <button
              onClick={() => setTextSize("small")}
              className={`w-6 h-6 rounded flex items-center justify-center font-bold ${textSize === "small" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Small text"
            >
              A
            </button>
            <button
              onClick={() => setTextSize("medium")}
              className={`w-7 h-7 rounded flex items-center justify-center font-bold text-sm ${textSize === "medium" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Medium text"
            >
              A
            </button>
            <button
              onClick={() => setTextSize("large")}
              className={`w-8 h-8 rounded flex items-center justify-center font-bold text-md ${textSize === "large" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              title="Large text"
            >
              A
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-base mr-2"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <AppIcon name={isFullscreen ? "Minimize2" : "Maximize2"} size={18} />
          </button>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${
              secondsRemaining < 300
                ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                : "bg-muted border-border text-foreground"
            }`}
          >
            <AppIcon name="Clock" size={16} />
            <span>{formatTime(secondsRemaining)}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Double-Scroll Workspace container */}
      <main className="container mx-auto p-4 flex-1">
        <SplitPaneLayout
          leftPane={
            <PassageViewer
              title={`Passage ${activePassage.passage_number}: ${activePassage.title}`}
              subTitle={activePassage.sub_title}
              contentHtml={activePassage.content_html}
              textSize={textSize}
              onTextSelect={setSelectionState}
            />
          }
          rightPane={
            <QuestionPane
              questions={activePassage.questions || []}
              userAnswers={userAnswers}
              onAnswerChange={handleAnswerChange}
            />
          }
        />
      </main>

      {/* 3. Bottom question navigators strip */}
      <ReadingFooterNav
        totalQuestions={totalQuestionsCount}
        activeQuestionNumber={activeQuestionNum}
        userAnswers={userAnswers}
        flaggedQuestions={flaggedQuestions}
        onQuestionSelect={handleQuestionSelect}
        onToggleFlag={handleToggleFlag}
        onSubmitClick={() => setIsSubmitModalOpen(true)}
        isSubmitting={isSubmitting}
      />

      {/* 4. Submission Confirm Modal overlay */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-md p-6 space-y-6 animate-in fade-in zoom-in-95 duration-base">
            <div className="flex items-center gap-3 text-primary">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <AppIcon name="FileCheck" size={22} />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground">
                Submit Reading Test
              </h3>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have answered <span className="font-bold text-foreground">{answeredCount}</span> of <span className="font-bold text-foreground">{totalQuestionsCount}</span> questions. Are you sure you want to finish the test and submit your answers for grading?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Yes, Submit Test"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Floating Highlighter selection options menu */}
      <HighlighterMenu
        position={selectionState?.position}
        visible={!!selectionState}
        onHighlight={handleHighlight}
        onAddNote={handleAddStickyNote}
        onClear={handleClearHighlight}
      />

      {/* 6. Floating Sticky Note items */}
      {stickyNotes.map((note) => (
        <StickyNote
          key={note.id}
          id={note.id}
          selectedText={note.selectedText}
          initialText={note.text}
          initialPosition={note.position}
          onChange={handleNoteChange}
          onDelete={handleNoteDelete}
        />
      ))}
    </div>
  );
};

export default ReadingCbtTest;
