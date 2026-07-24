import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ListeningService } from "services/assessment/listeningService";
import ListeningQuestionPane from "./components/ListeningQuestionPane";
import AppIcon from "components/AppIcon";
import Button from "components/ui/Button";

import { API_BASE_URL } from "../../../../config/apiConfig";

const getAudioUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

const ListeningCbtTest = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // Test session state
  const [session, setSession] = useState(null);
  const [sections, setSections] = useState([]);
  const [testMetadata, setTestMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Exam interface configurations
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [activeQuestionNum, setActiveQuestionNum] = useState(1);
  const [userAnswers, setUserAnswers] = useState({});
  const [contrastTheme, setContrastTheme] = useState("standard"); // standard, dark, high-contrast
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [textSize, setTextSize] = useState("medium"); // small, medium, large

  // Timer & Autosave states
  const [secondsRemaining, setSecondsRemaining] = useState(1800); // 30 mins standard for Listening
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [autosaveStatus, setAutosaveStatus] = useState("saved"); // saved, saving, error
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Refs for tracking timer, draft, and audio
  const timerRef = useRef(null);
  const autosaveIntervalRef = useRef(null);
  const answersRef = useRef({});
  const flaggedRef = useRef([]);
  const timeSpentRef = useRef(0);
  const audioRef = useRef(null);

  // Sync refs with state
  useEffect(() => {
    answersRef.current = userAnswers;
  }, [userAnswers]);

  useEffect(() => {
    flaggedRef.current = flaggedQuestions;
  }, [flaggedQuestions]);

  useEffect(() => {
    timeSpentRef.current = timeSpentSeconds;
  }, [timeSpentSeconds]);

  // Load test session data
  useEffect(() => {
    const loadTestData = async () => {
      try {
        setLoading(true);
        const sessionRes = await ListeningService.getListeningSession(sessionId);
        if (!sessionRes.success) {
          setError(sessionRes.error || "Failed to load session details.");
          return;
        }

        const sessionData = sessionRes.data;
        if (sessionData.status === "completed") {
          navigate(`/assessment/listening/results/${sessionId}`, { replace: true });
          return;
        }

        setSession(sessionData);
        setUserAnswers(sessionData.user_answers || {});
        setFlaggedQuestions(sessionData.flagged_questions || []);
        setTimeSpentSeconds(sessionData.time_spent_seconds || 0);

        const testRes = await ListeningService.getListeningTestDetails(sessionData.listening_test_id);
        if (!testRes.success) {
          setError(testRes.error || "Failed to load test details.");
          return;
        }

        setSections(testRes.data.sections || []);
        setTestMetadata(testRes.data.test);

        const duration = (testRes.data.test.duration_minutes || 30) * 60;
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

  // Timer loop
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

  // Autosave interval
  useEffect(() => {
    if (loading || error || !session) return;

    autosaveIntervalRef.current = setInterval(() => {
      triggerAutosave();
    }, 10000);

    return () => {
      if (autosaveIntervalRef.current) clearInterval(autosaveIntervalRef.current);
    };
  }, [loading, error, session]);

  const triggerAutosave = async () => {
    setAutosaveStatus("saving");
    try {
      const res = await ListeningService.saveListeningDraft(sessionId, {
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

  // Audio lifecycle hooks
  const prevAudioUrlRef = useRef("");

  useEffect(() => {
    const currentAudioUrl = activeSection ? activeSection.audio_url : "";
    if (currentAudioUrl !== prevAudioUrlRef.current) {
      // Audio URL has changed, reset player
      setIsPlaying(false);
      setAudioCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.playbackRate = playbackSpeed;
      }
      prevAudioUrlRef.current = currentAudioUrl;
    }
  }, [activeSectionIdx, activeSection]);

  // Format time (seconds to MM:SS)
  const formatTime = (timeInSecs) => {
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // HTML5 audio control helpers
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error("Audio playback error:", err));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioProgressSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setAudioCurrentTime(val);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (audioRef.current) {
      const nextMuteState = !isMuted;
      audioRef.current.muted = nextMuteState;
      setIsMuted(nextMuteState);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // CBT controls
  const handleAnswerChange = (qNum, val) => {
    setUserAnswers((prev) => ({
      ...prev,
      [String(qNum)]: val
    }));
    setAutosaveStatus("saving");
  };

  const handleToggleFlag = (qNum) => {
    setFlaggedQuestions((prev) =>
      prev.includes(qNum) ? prev.filter((n) => n !== qNum) : [...prev, qNum]
    );
    setAutosaveStatus("saving");
  };

  const handleQuestionSelect = (qNum) => {
    setActiveQuestionNum(qNum);
    // Find section containing this question
    const secIdx = sections.findIndex((s) =>
      s.questions?.some((q) => q.question_number === qNum)
    );
    if (secIdx !== -1 && secIdx !== activeSectionIdx) {
      setActiveSectionIdx(secIdx);
    }
    // Scroll to the question block
    setTimeout(() => {
      const el = document.getElementById(`question-${qNum}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setIsSubmitModalOpen(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (autosaveIntervalRef.current) clearInterval(autosaveIntervalRef.current);
    if (audioRef.current) audioRef.current.pause();

    try {
      const res = await ListeningService.submitListeningSession(sessionId, {
        userAnswers,
        flaggedQuestions,
        timeSpentSeconds
      });

      if (res.success) {
        navigate(`/assessment/listening/results/${sessionId}`, { replace: true });
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
      await ListeningService.submitListeningSession(sessionId, {
        userAnswers: answersRef.current,
        flaggedQuestions: flaggedRef.current,
        timeSpentSeconds: timeSpentRef.current
      });
      navigate(`/assessment/listening/results/${sessionId}`, { replace: true });
    } catch (err) {
      console.error("Auto submit failed:", err);
    }
  };

  // Formatting styling classes
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

  const getTextSizeClass = () => {
    switch (textSize) {
      case "small":
        return "text-xs";
      case "large":
        return "text-base md:text-lg";
      case "medium":
      default:
        return "text-sm";
    }
  };

  const isAnswered = (num) => {
    const ans = userAnswers[String(num)];
    if (ans === undefined || ans === null) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    return String(ans).trim() !== "";
  };

  const isFlagged = (num) => flaggedQuestions.includes(num);

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading listening exam components...</div>;
  }

  if (error || !session) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-card border border-destructive/20 rounded-xl p-8">
        <h2 className="text-xl font-heading font-bold text-destructive mb-2">Error Launching CBT</h2>
        <p className="text-muted-foreground text-sm mb-4">{error || "Attempt session could not be recovered."}</p>
        <Button variant="outline" onClick={() => navigate("/assessment/listening/history")}>Back to History</Button>
      </div>
    );
  }

  const activeSection = sections[activeSectionIdx];

  return (
    <div className={`w-full min-h-screen pb-24 ${getThemeClasses()} ${getTextSizeClass()}`}>
      
      {/* 1. STICKY TOP CONTROL HEADER */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm p-4 select-none">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Test Metadata & Autosave Indicator */}
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              <AppIcon name="Headphones" size={20} />
            </span>
            <div>
              <h2 className="font-heading font-bold text-base md:text-lg text-foreground leading-tight">
                {testMetadata?.title}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-mono">
                <span>Part {activeSectionIdx + 1} of 4</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <AppIcon name={autosaveStatus === "saved" ? "CloudLightning" : autosaveStatus === "saving" ? "RefreshCw" : "AlertTriangle"} size={10} className={autosaveStatus === "saving" ? "animate-spin" : ""} />
                  {autosaveStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Exam Section Tabs */}
          <div className="flex items-center bg-muted/40 border border-border p-1 rounded-xl">
            {sections.map((sec, idx) => (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSectionIdx(idx);
                  if (sec.questions && sec.questions.length > 0) {
                    setActiveQuestionNum(sec.questions[0].question_number);
                  }
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition duration-base ${
                  activeSectionIdx === idx
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Part {sec.section_number}
              </button>
            ))}
          </div>

          {/* Sizing & Theme Adjusters */}
          <div className="flex items-center gap-4">
            {/* Text Size Slider */}
            <div className="flex items-center gap-1.5 bg-muted/40 border border-border p-1 rounded-xl text-xs">
              <button
                onClick={() => setTextSize("small")}
                className={`px-2 py-0.5 rounded ${textSize === "small" ? "bg-card font-bold" : "text-muted-foreground"}`}
              >
                A
              </button>
              <button
                onClick={() => setTextSize("medium")}
                className={`px-2 py-0.5 rounded text-sm ${textSize === "medium" ? "bg-card font-bold" : "text-muted-foreground"}`}
              >
                A
              </button>
              <button
                onClick={() => setTextSize("large")}
                className={`px-2 py-0.5 rounded text-base ${textSize === "large" ? "bg-card font-bold" : "text-muted-foreground"}`}
              >
                A
              </button>
            </div>

            {/* Contrast Theme Selector */}
            <div className="flex items-center gap-1 bg-muted/40 border border-border p-1 rounded-xl text-xs">
              <button
                onClick={() => setContrastTheme("standard")}
                className={`px-2 py-0.5 rounded ${contrastTheme === "standard" ? "bg-card font-bold text-foreground" : "text-muted-foreground"}`}
              >
                Light
              </button>
              <button
                onClick={() => setContrastTheme("dark")}
                className={`px-2 py-0.5 rounded ${contrastTheme === "dark" ? "bg-card font-bold text-foreground" : "text-muted-foreground"}`}
              >
                Dark
              </button>
              <button
                onClick={() => setContrastTheme("high-contrast")}
                className={`px-2 py-0.5 rounded ${contrastTheme === "high-contrast" ? "bg-yellow-400 text-black border border-yellow-500 font-bold" : "text-muted-foreground"}`}
              >
                Contrast
              </button>
            </div>

            {/* Main Timer Display */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-center select-none flex items-center gap-2">
              <AppIcon name="Clock" size={16} className="text-primary animate-pulse" />
              <span className="font-mono text-base font-bold text-primary">
                {formatTime(secondsRemaining)}
              </span>
            </div>

          </div>

        </div>
      </header>

      {/* 2. CORE AUDIO PLAYER & QUESTIONS PANEL CONTAINER */}
      <main className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        
        {/* HTML5 Audio Tag */}
        <audio
          ref={audioRef}
          src={activeSection ? getAudioUrl(activeSection.audio_url) : ""}
          onTimeUpdate={handleAudioTimeUpdate}
          onLoadedMetadata={handleAudioLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Premium Sticky Audio Controller Panel */}
        {activeSection && (
          <div className="bg-card border border-border rounded-2xl p-5 shadow-md space-y-4 select-none">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Play / Pause / Current Track Metadata */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center shadow transition-all active:scale-95 flex-shrink-0"
                >
                  <AppIcon name={isPlaying ? "Pause" : "Play"} size={22} className={isPlaying ? "" : "ml-1"} />
                </button>
                <div>
                  <h3 className="font-bold text-foreground leading-tight">
                    {activeSection.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Click play to listen. You can adjust the playback speed below.
                  </span>
                </div>
              </div>

              {/* Playback speed controls */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground font-semibold">Speed:</span>
                <div className="flex items-center bg-muted/40 border border-border p-1 rounded-xl">
                  {[1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-3 py-1 rounded-lg font-bold transition duration-base ${
                        playbackSpeed === speed ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume & Mute control slider */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button onClick={handleToggleMute} className="text-muted-foreground hover:text-foreground transition-colors">
                  <AppIcon name={isMuted || audioVolume === 0 ? "VolumeX" : audioVolume < 0.4 ? "Volume1" : "Volume2"} size={20} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : audioVolume}
                  onChange={handleVolumeChange}
                  className="w-24 accent-primary cursor-pointer"
                  title="Volume"
                />
              </div>

            </div>

            {/* Audio Progress Timeline Seeker */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={audioDuration || 100}
                step="0.1"
                value={audioCurrentTime}
                onChange={handleAudioProgressSeek}
                className="w-full accent-primary cursor-pointer h-1.5 rounded-lg bg-muted appearance-none"
              />
              <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                <span>{formatTime(audioCurrentTime)}</span>
                <span>{formatTime(audioDuration)}</span>
              </div>
            </div>

          </div>
        )}

        {/* Section Heading info */}
        {activeSection && (
          <div className="space-y-4">
            <h1 className="text-2xl font-heading font-extrabold text-foreground border-b border-border pb-3">
              {activeSection.title}
            </h1>
            
            {/* Detailed Question Pane displaying questions for this section */}
            <ListeningQuestionPane
              questions={activeSection.questions || []}
              userAnswers={userAnswers}
              onAnswerChange={handleAnswerChange}
            />
          </div>
        )}

      </main>

      {/* 3. STICKY BOTTOM PALETTE FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg p-4 select-none">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Flag review triggers */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Button
              variant={isFlagged(activeQuestionNum) ? "primary" : "outline"}
              size="sm"
              onClick={() => handleToggleFlag(activeQuestionNum)}
              className={isFlagged(activeQuestionNum) ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" : ""}
            >
              <span className="flex items-center gap-2">
                <AppIcon name="Bookmark" size={16} />
                {isFlagged(activeQuestionNum) ? "Unflag Question" : "Flag for Review"}
              </span>
            </Button>
            <div className="text-xs text-muted-foreground hidden sm:block">
              Active Question: <span className="font-bold text-foreground">#{activeQuestionNum}</span>
            </div>
          </div>

          {/* Question grid palette navigator (1-40) */}
          <div className="flex-1 overflow-x-auto w-full max-w-2xl px-2">
            <div className="flex items-center gap-1.5 py-1 min-w-[650px] justify-start md:justify-center">
              {Array.from({ length: 40 }, (_, idx) => {
                const qNum = idx + 1;
                const active = qNum === activeQuestionNum;
                const answered = isAnswered(qNum);
                const flagged = isFlagged(qNum);

                let btnClasses = "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all duration-base border relative ";

                if (active) {
                  btnClasses += "bg-primary text-primary-foreground border-primary scale-110 shadow-md z-10";
                } else if (flagged) {
                  btnClasses += "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300";
                } else if (answered) {
                  btnClasses += "bg-muted/80 border-border/80 text-foreground hover:bg-muted/100";
                } else {
                  btnClasses += "bg-card border-border hover:bg-muted/40 text-muted-foreground";
                }

                return (
                  <button
                    key={qNum}
                    onClick={() => handleQuestionSelect(qNum)}
                    className={btnClasses}
                    title={`Question ${qNum}`}
                  >
                    {qNum}
                    {flagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-card"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submission action trigger */}
          <div className="w-full md:w-auto flex justify-end">
            <Button
              variant="primary"
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={isSubmitting}
              className="px-6"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </Button>
          </div>

        </div>
      </footer>

      {/* 4. SUBMISSION CONFIRMATION MODAL */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AppIcon name="AlertTriangle" size={28} />
              <h3 className="text-lg font-heading font-bold text-foreground">Submit Exam Confirmation</h3>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to end and submit your Listening test? You will not be able to change your answers once submitted.
            </p>

            {/* Answer completion check indicator */}
            {(() => {
              const unanswered = Array.from({ length: 40 }, (_, i) => i + 1).filter(n => !isAnswered(n));
              if (unanswered.length > 0) {
                return (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
                    ⚠️ You have <span className="font-bold">{unanswered.length} unanswered questions</span> remaining (Questions: {unanswered.slice(0, 5).join(", ")}{unanswered.length > 5 ? "..." : ""}).
                  </div>
                );
              }
              return (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300">
                  ✅ Excellent! You have entered answers for all 40 questions.
                </div>
              );
            })()}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Yes, Submit Test"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ListeningCbtTest;
