import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ListeningService } from "services/assessment/listeningService";
import Button from "components/ui/Button";
import AppIcon from "components/AppIcon";

import { API_BASE_URL } from "../../../../config/apiConfig";

const getAudioUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

const ListeningResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Custom states
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [selectedQuestionNum, setSelectedQuestionNum] = useState(1);
  const [filterMode, setFilterMode] = useState("all"); // all, incorrect
  const [contrastTheme, setContrastTheme] = useState("standard");
  const [textSize, setTextSize] = useState("medium");

  // Audio player state per section
  const [activePlayingSec, setActivePlayingSec] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await ListeningService.getListeningSessionResults(sessionId);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to retrieve grading metrics.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId]);

  const formatTimeSpent = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  // Audio toggler
  const handleTogglePlayAudio = (sectionIndex, audioUrl) => {
    if (!audioRef.current) return;
    
    const targetSrc = getAudioUrl(audioUrl);
    const isSameAudio = audioRef.current.src === targetSrc || (audioRef.current.src && audioRef.current.src.endsWith(audioUrl));

    if (isSameAudio) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          setActivePlayingSec(sectionIndex);
        });
      }
    } else {
      audioRef.current.pause();
      setActivePlayingSec(sectionIndex);
      audioRef.current.src = targetSrc;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  const handleSelectQuestion = (qNum) => {
    setSelectedQuestionNum(qNum);
    
    // Find section containing this question
    const secIdx = data?.sections?.findIndex(s => 
      s.questions?.some(q => q.question_number === qNum)
    );
    if (secIdx !== -1 && secIdx !== undefined && secIdx !== activeSectionIdx) {
      setActiveSectionIdx(secIdx);
    }
    
    setTimeout(() => {
      const el = document.getElementById(`review-question-${qNum}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const getThemeClasses = () => {
    switch (contrastTheme) {
      case "dark":
        return "dark bg-slate-950 text-slate-50 border-slate-800";
      case "high-contrast":
        return "bg-black text-yellow-300 font-mono border-yellow-500 [&_input]:bg-black [&_input]:text-yellow-300 [&_input]:border-yellow-500 [&_button]:border-yellow-500 [&_header]:border-yellow-500";
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

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground animate-pulse">Retrieving scoring details...</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center bg-card border border-destructive/20 rounded-xl p-8">
        <h2 className="text-xl font-heading font-bold text-destructive mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground text-sm mb-4">{error || "Results data could not be recovered."}</p>
        <Button variant="outline" onClick={() => navigate("/assessment/listening/history")}>Back to History</Button>
      </div>
    );
  }

  const { session, test, sections, grading } = data;
  const gradedResults = grading.results || [];
  
  // Audio tags setup
  return (
    <div className={`w-full min-h-screen py-8 pb-24 ${getThemeClasses()} ${getTextSizeClass()}`}>
      
      {/* Hidden Audio element for timeline playback */}
      <audio 
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setActivePlayingSec(null);
        }}
      />

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        
        {/* TOP METADATA & BUTTON PANEL */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <span className="text-xs uppercase font-mono tracking-wider text-primary font-bold">
              Practice Results
            </span>
            <h1 className="text-3xl font-heading font-extrabold text-foreground">
              {test?.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Contrast adjusters */}
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

            <Button variant="outline" onClick={() => navigate("/assessment/listening/history")}>
              View History
            </Button>
          </div>
        </div>

        {/* METRICS CARDS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
          
          {/* Band Score Card */}
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase font-mono">IELTS Band Score</h3>
            <div className="text-4xl font-heading font-extrabold text-primary font-mono">
              {session.band_score}
            </div>
            <p className="text-xs text-muted-foreground">Deterministic IELTS raw-to-band evaluation</p>
          </div>

          {/* Raw Score Card */}
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase font-mono">Raw Correct Score</h3>
            <div className="text-4xl font-heading font-extrabold text-foreground font-mono">
              {session.raw_score} <span className="text-xl text-muted-foreground">/ 40</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {((session.raw_score / 40) * 100).toFixed(0)}% correctness rating
            </p>
          </div>

          {/* Time spent Card */}
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-2 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase font-mono">Time Spent</h3>
            <div className="text-4xl font-heading font-extrabold text-foreground font-mono">
              {formatTimeSpent(session.time_spent_seconds)}
            </div>
            <p className="text-xs text-muted-foreground">Allocated time: 30 minutes</p>
          </div>

        </div>

        {/* 1-40 DIAGNOSTIC REVIEW PALETTE GRID */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4 select-none">
          <h3 className="font-heading font-bold text-foreground">Diagnostic Question Grid (1 - 40)</h3>
          
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {gradedResults.map((res) => {
              const qNum = res.questionNumber;
              const active = qNum === selectedQuestionNum;
              const correct = res.isCorrect;

              let btnClasses = "h-10 rounded-xl font-bold font-mono text-xs flex flex-col items-center justify-center border relative transition-all duration-base ";
              if (active) {
                btnClasses += "ring-2 ring-primary scale-105 z-10 ";
              }

              if (correct) {
                btnClasses += "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300";
              } else {
                btnClasses += "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-800 dark:text-rose-300";
              }

              return (
                <button
                  key={res.questionId}
                  onClick={() => handleSelectQuestion(qNum)}
                  className={btnClasses}
                >
                  <span>#{qNum}</span>
                  <span className="text-[9px] font-mono leading-none mt-0.5 capitalize">
                    {correct ? "Correct" : "Incorrect"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Color Indicators Legends */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600 block"></span>
              Correct Answers
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600 block"></span>
              Incorrect Answers
            </span>
          </div>

        </div>

        {/* CORE INTERACTIVE QUESTION REVIEW LIST */}
        <div className="space-y-6">
          
          {/* Filtering buttons & part selection */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border pb-3 select-none">
            
            {/* Parts selector tabs */}
            <div className="flex items-center bg-muted/40 border border-border p-1 rounded-xl w-full sm:w-auto">
              {sections.map((sec, idx) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSectionIdx(idx);
                    if (sec.questions && sec.questions.length > 0) {
                      setSelectedQuestionNum(sec.questions[0].question_number);
                    }
                  }}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition duration-base ${
                    activeSectionIdx === idx
                      ? "bg-card text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Part {sec.section_number}
                </button>
              ))}
            </div>

            {/* Answer Filters (All / Incorrect only) */}
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end">
              <span className="text-muted-foreground font-semibold">Filter:</span>
              <div className="flex items-center bg-muted/40 border border-border p-1 rounded-xl">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1 rounded-lg font-bold transition duration-base ${
                    filterMode === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  All Questions
                </button>
                <button
                  onClick={() => setFilterMode("incorrect")}
                  className={`px-3 py-1 rounded-lg font-bold transition duration-base ${
                    filterMode === "incorrect" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Incorrect Only
                </button>
              </div>
            </div>

          </div>

          {/* Active section detailed list display */}
          {(() => {
            const activeSection = sections[activeSectionIdx];
            if (!activeSection) return null;

            // Filter questions for display
            const filteredQuestions = (activeSection.questions || []).filter((q) => {
              if (filterMode === "incorrect") {
                const graded = gradedResults.find((r) => r.questionNumber === q.question_number);
                return graded && !graded.isCorrect;
              }
              return true;
            });

            const isCurrentSecPlaying = activePlayingSec === activeSectionIdx && isPlaying;

            return (
              <div className="space-y-6">
                
                {/* Audio track re-player card */}
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTogglePlayAudio(activeSectionIdx, activeSection.audio_url)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow transition-all active:scale-95 flex-shrink-0 ${
                        isCurrentSecPlaying 
                          ? "bg-rose-500 text-white hover:bg-rose-600" 
                          : "bg-primary text-primary-foreground hover:bg-primary/95"
                      }`}
                    >
                      <AppIcon name={isCurrentSecPlaying ? "Pause" : "Play"} size={18} className={isCurrentSecPlaying ? "" : "ml-0.5"} />
                    </button>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{activeSection.title}</h4>
                      <p className="text-xs text-muted-foreground">Click to play this section's audio recording</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-muted rounded text-muted-foreground">
                    Part {activeSection.section_number} Recording
                  </span>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                    No questions match the current filters.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((q) => {
                      const gradedRes = gradedResults.find((r) => r.questionNumber === q.question_number);
                      if (!gradedRes) return null;

                      const isSelected = q.question_number === selectedQuestionNum;

                      return (
                        <div
                          key={q.id}
                          id={`review-question-${q.question_number}`}
                          className={`bg-card border rounded-2xl p-6 transition-all duration-base space-y-4 shadow-sm ${
                            isSelected ? "border-primary ring-1 ring-primary/45" : "border-border"
                          }`}
                        >
                          {/* 1. Header Prompt */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className={`flex-shrink-0 w-7 h-7 rounded-full font-mono text-xs font-bold flex items-center justify-center mt-0.5 shadow-sm ${
                                gradedRes.isCorrect 
                                  ? "bg-emerald-500 text-white" 
                                  : "bg-rose-500 text-white"
                              }`}>
                                {q.question_number}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-foreground leading-relaxed">
                                  {q.question_data?.text || q.question_data?.instruction_text || "Fill in the correct value"}
                                </p>
                                {q.question_data?.options && (
                                  <div className="mt-2 space-y-1.5 pl-1.5">
                                    {q.question_data.options.map((opt, idx) => (
                                      <div key={idx} className="text-xs text-muted-foreground leading-snug">
                                        {opt}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Correct/Incorrect Flag badge */}
                            <span className={`text-[10px] font-bold font-mono tracking-wide uppercase px-2 py-0.5 rounded-full select-none ${
                              gradedRes.isCorrect 
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200" 
                                : "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200"
                            }`}>
                              {gradedRes.isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>

                          {/* 2. Side-by-side Response Review comparison grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60 select-text">
                            
                            {/* Student Answer */}
                            <div className="bg-muted/30 border border-border/40 rounded-xl p-3">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                                Your Response
                              </span>
                              <span className={`text-sm font-bold font-mono ${
                                gradedRes.isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                              }`}>
                                {gradedRes.userAnswer !== null ? String(gradedRes.userAnswer) : "(No Answer Provided)"}
                              </span>
                            </div>

                            {/* Correct Key */}
                            <div className="bg-muted/30 border border-border/40 rounded-xl p-3">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block mb-1">
                                Correct Answer(s)
                              </span>
                              <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                                {gradedRes.correctAnswers.join("  /  ")}
                              </span>
                            </div>

                          </div>

                          {/* 3. Explanation detail box */}
                          {(gradedRes.explanation || q.explanation) && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 select-text">
                              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                                <AppIcon name="MessageSquare" size={14} />
                                Audio Script Transcript
                              </span>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {gradedRes.explanation || q.explanation}
                              </p>
                              {q.citation_excerpt && (
                                <div className="text-[10px] font-mono italic text-foreground/80 bg-background/50 border border-border/40 rounded px-2.5 py-1.5 mt-2">
                                  "{q.citation_excerpt}"
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

        </div>

      </div>
    </div>
  );
};

export default ListeningResults;
