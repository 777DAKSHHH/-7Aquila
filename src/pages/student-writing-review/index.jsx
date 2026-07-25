import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import TopNav from "../../components/ui/TopNav";
import Button from "../../components/ui/Button";
import Icon from "../../components/AppIcon";

const StudentWritingReview = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeEssayTab, setActiveEssayTab] = useState("task1");
  const [activeFeedbackTab, setActiveFeedbackTab] = useState("ai");

  // Teacher feedback form states
  const [teacherBand, setTeacherBand] = useState("");
  const [teacherTask1Band, setTeacherTask1Band] = useState("");
  const [teacherTask2Band, setTeacherTask2Band] = useState("");
  const [teacherFeedback, setTeacherFeedback] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        const { data, error: fetchErr } = await supabase
          .from("writing_sessions")
          .select(`
            *,
            profiles (
              full_name,
              email,
              username
            ),
            writing_task1_questions (title, prompt),
            writing_task2_questions (title, prompt)
          `)
          .eq("id", sessionId)
          .single();

        if (fetchErr) throw fetchErr;

        setSession(data);
        // Pre-fill teacher feedback form if already reviewed
        setTeacherBand(data.teacher_band || data.overall_band || "");
        setTeacherTask1Band(data.task1_band || "");
        setTeacherTask2Band(data.task2_band || "");
        setTeacherFeedback(data.teacher_feedback || "");

        // Auto focus on the task that has content
        if (!data.task1_answer && data.task2_answer) {
          setActiveEssayTab("task2");
        }
      } catch (err) {
        console.error("Error loading writing session:", err);
        setError("Failed to load writing session details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!teacherBand || !teacherFeedback) {
      alert("Please provide at least a Teacher Overall Band and review feedback.");
      return;
    }

    try {
      setSavingReview(true);
      const { error: updateErr } = await supabase
        .from("writing_sessions")
        .update({
          teacher_band: parseFloat(teacherBand),
          task1_band: teacherTask1Band ? parseFloat(teacherTask1Band) : null,
          task2_band: teacherTask2Band ? parseFloat(teacherTask2Band) : null,
          teacher_feedback: teacherFeedback,
          status: "reviewed",
          completed_at: new Date().toISOString()
        })
        .eq("id", sessionId);

      if (updateErr) throw updateErr;

      alert("Teacher feedback successfully submitted!");
      navigate("/faculty-dashboard");
    } catch (err) {
      console.error("Failed saving teacher feedback:", err);
      alert("Error saving review: " + err.message);
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav userRole="faculty" />
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="text-center space-y-4">
            <Icon name="Loader2" size={40} className="animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground font-medium">Loading student writing attempt...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav userRole="faculty" />
        <div className="max-w-md mx-auto mt-20 p-6 bg-card border border-border rounded-xl text-center shadow-md space-y-4">
          <Icon name="AlertTriangle" size={48} className="text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Error Loading Attempt</h2>
          <p className="text-muted-foreground text-sm">{error || "The session could not be recovered."}</p>
          <Button variant="outline" onClick={() => navigate("/faculty-dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  let aiData = session.ai_detailed_feedback;
  if (typeof aiData === "string") {
    try {
      aiData = JSON.parse(aiData);
    } catch (e) {
      aiData = null;
    }
  }

  const studentName = session.profiles?.full_name || "Unknown Student";
  const studentEmail = session.profiles?.email || "No email";
  const durationMinutes = Math.floor((session.total_time_seconds || 0) / 60);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav userRole="faculty" />

      {/* Header Summary */}
      <div className="bg-card border-b border-border py-4 px-6 md:px-8">
        <div className="container mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/faculty-dashboard")} className="p-1 h-auto hover:bg-muted">
                <Icon name="ArrowLeft" size={16} />
              </Button>
              <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">{studentName}</h1>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Email: {studentEmail} • Username: {session.profiles?.username || "N/A"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-muted/60 px-3 py-1.5 rounded-lg border border-border/40 font-mono">
              <span className="text-muted-foreground block text-[9px] uppercase font-bold">Session ID</span>
              <span className="font-semibold text-foreground">{session.id.substring(0, 8)}...</span>
            </div>
            <div className="bg-muted/60 px-3 py-1.5 rounded-lg border border-border/40 font-mono">
              <span className="text-muted-foreground block text-[9px] uppercase font-bold">Time Elapsed</span>
              <span className="font-semibold text-foreground">{durationMinutes} minutes</span>
            </div>
            <div className="bg-muted/60 px-3 py-1.5 rounded-lg border border-border/40 font-mono">
              <span className="text-muted-foreground block text-[9px] uppercase font-bold">Status</span>
              <span className="font-semibold text-primary uppercase">{session.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Portal */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        
        {/* Left Pane - Student Essay Text */}
        <div className="border-r border-border p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <h2 className="text-base font-semibold font-heading text-foreground flex items-center gap-2">
              <Icon name="FileText" size={18} className="text-primary" />
              Student Submissions
            </h2>

            {/* Essay Tabs */}
            <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs">
              <button
                onClick={() => setActiveEssayTab("task1")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeEssayTab === "task1"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Task 1 (Report)
              </button>
              <button
                onClick={() => setActiveEssayTab("task2")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeEssayTab === "task2"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Task 2 (Essay)
              </button>
            </div>
          </div>

          {activeEssayTab === "task1" ? (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="text-[10px] uppercase font-bold text-primary block mb-0.5">Task 1 Prompt Title</span>
                <h3 className="font-bold text-foreground text-sm">{session.writing_task1_questions?.title || "Academic Report Task 1"}</h3>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto">
                  {session.writing_task1_questions?.prompt || "No instructions provided."}
                </p>
              </div>
              <div className="flex-grow bg-card p-4 rounded-xl border border-border overflow-y-auto min-h-[300px] shadow-sm select-text whitespace-pre-wrap text-foreground font-caption leading-relaxed">
                {session.task1_answer || "No response submitted for Task 1."}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 font-mono">
                <span>Task 1 Word Count:</span>
                <span className="font-bold text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/30">
                  {session.task1_word_count || 0} words
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="text-[10px] uppercase font-bold text-primary block mb-0.5">Task 2 Prompt Title</span>
                <h3 className="font-bold text-foreground text-sm">{session.writing_task2_questions?.title || "IELTS Essay Task 2"}</h3>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto">
                  {session.writing_task2_questions?.prompt || "No instructions provided."}
                </p>
              </div>
              <div className="flex-grow bg-card p-4 rounded-xl border border-border overflow-y-auto min-h-[300px] shadow-sm select-text whitespace-pre-wrap text-foreground font-caption leading-relaxed">
                {session.task2_answer || "No response submitted for Task 2."}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 font-mono">
                <span>Task 2 Word Count:</span>
                <span className="font-bold text-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/30">
                  {session.task2_word_count || 0} words
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Pane - AI Evaluation & Teacher Review */}
        <div className="bg-muted/10 p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <h2 className="text-base font-semibold font-heading text-foreground flex items-center gap-2">
              <Icon name="Layers" size={18} className="text-primary" />
              Evaluation Panel
            </h2>

            {/* Navigation Tabs */}
            <div className="flex gap-1 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs">
              <button
                onClick={() => setActiveFeedbackTab("ai")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeFeedbackTab === "ai"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                AI Feedback Detail
              </button>
              <button
                onClick={() => setActiveFeedbackTab("teacher")}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  activeFeedbackTab === "teacher"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Teacher Review
              </button>
            </div>
          </div>

          {/* Tab 1: AI Feedback Detail */}
          {activeFeedbackTab === "ai" && (
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-1 animate-in fade-in duration-200">
              {aiData ? (
                <>
                  {/* Scores Summary */}
                  <div className="flex items-center justify-between bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                    <div>
                      <span className="font-bold text-emerald-600 block text-sm">Overall Band Score (AI)</span>
                      <span className="text-[10px] text-muted-foreground">Derived from IELTS rubrics</span>
                    </div>
                    <span className="font-mono font-extrabold text-emerald-600 text-xl">
                      Band {aiData.overall_band?.toFixed(1) || session.overall_band?.toFixed(1) || "N/A"}
                    </span>
                  </div>

                  {/* Subscores Grid */}
                  {aiData.criterion_scores && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
                      <div className="bg-card border border-border/40 p-2.5 rounded-lg">
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Task Response</span>
                        <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                          {aiData.criterion_scores.task_achievement || aiData.criterion_scores.task_response || "N/A"}
                        </span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded-lg">
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Coherence</span>
                        <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                          {aiData.criterion_scores.coherence_and_cohesion || "N/A"}
                        </span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded-lg">
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Vocabulary</span>
                        <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                          {aiData.criterion_scores.lexical_resource || "N/A"}
                        </span>
                      </div>
                      <div className="bg-card border border-border/40 p-2.5 rounded-lg">
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Grammar</span>
                        <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                          {aiData.criterion_scores.grammatical_range_and_accuracy || "N/A"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* strengths & improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
                    <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 space-y-1">
                      <span className="font-bold text-emerald-600 block uppercase tracking-wide">Strengths</span>
                      <ul className="list-disc pl-4 space-y-1 text-foreground/80">
                        {(aiData.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/10 space-y-1">
                      <span className="font-bold text-indigo-600 block uppercase tracking-wide">Areas for Improvement</span>
                      <ul className="list-disc pl-4 space-y-1 text-foreground/80">
                        {(aiData.weaknesses || aiData.improvements || []).map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* Grammar errors */}
                  {aiData.grammar_errors && aiData.grammar_errors.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-foreground block border-b border-border/60 pb-1 flex items-center gap-1.5 text-primary uppercase">
                        <Icon name="AlertCircle" size={14} />
                        Grammar Errors
                      </span>
                      <div className="space-y-2.5">
                        {aiData.grammar_errors.map((err, idx) => (
                          <div key={idx} className="bg-rose-50/10 border border-rose-100/30 rounded-xl p-3 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                              <div className="text-rose-600 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                                <span className="text-[9px] uppercase tracking-wider block font-bold text-rose-500/80 mb-0.5">Original</span>
                                "{err.mistake}"
                              </div>
                              <div className="text-emerald-600 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                                <span className="text-[9px] uppercase tracking-wider block font-bold text-emerald-500/80 mb-0.5">Correction</span>
                                "{err.correction}"
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed pl-1 pt-1 border-t border-border/30">
                              <span className="font-bold text-foreground/80">Explanation:</span> {err.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vocabulary Alternatives */}
                  {aiData.vocabulary_recommendations && aiData.vocabulary_recommendations.length > 0 && (
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-foreground block border-b border-border/60 pb-1 flex items-center gap-1.5 text-primary uppercase">
                        <Icon name="BookOpen" size={14} />
                        Vocabulary Replacements
                      </span>
                      <div className="space-y-2.5">
                        {aiData.vocabulary_recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-indigo-50/20 border border-indigo-100/30 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-rose-500 line-through font-mono font-medium">{rec.instead_of}</span>
                              <Icon name="ArrowRight" size={12} className="text-muted-foreground" />
                              <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                                {Array.isArray(rec.better_alternatives) ? rec.better_alternatives.join(", ") : rec.better_alternatives}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed pl-1">
                              <span className="font-bold text-foreground/80">Reason:</span> {rec.reason}
                            </p>
                            <div className="bg-card p-2 rounded border border-border/40 font-mono text-[10px] text-foreground/80 italic">
                              <span className="text-[9px] uppercase tracking-wider block font-bold text-primary/80 not-italic mb-0.5">Example Usage</span>
                              "{rec.example_sentence}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ideal Essay Rewrite */}
                  {aiData.ideal_essay && (
                    <div className="space-y-2 text-xs">
                      <span className="font-bold text-foreground block border-b border-border/60 pb-1 flex items-center gap-1.5 text-primary uppercase">
                        <Icon name="Sparkles" size={14} />
                        Band 7.5+ Ideal Essay Rewrite
                      </span>
                      <div className="bg-emerald-50/20 border border-emerald-500/15 rounded-xl p-4 leading-relaxed text-foreground select-text whitespace-pre-wrap max-h-[300px] overflow-y-auto font-medium font-caption">
                        {aiData.ideal_essay}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-10 font-caption">No structured AI feedback payload available for this attempt.</p>
              )}
            </div>
          )}

          {/* Tab 2: Teacher Review */}
          {activeFeedbackTab === "teacher" && (
            <form onSubmit={handleSaveReview} className="flex-1 flex flex-col space-y-4 animate-in fade-in duration-200">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/60 pb-2">
                Evaluation Scores Override & Feedback
              </h3>

              {/* Band Score Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Overall Band</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    value={teacherBand}
                    onChange={(e) => setTeacherBand(e.target.value)}
                    required
                    className="w-full bg-card border border-border rounded-lg p-2.5 text-sm font-mono font-bold text-primary focus:ring-1 focus:ring-primary"
                    placeholder="e.g. 7.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Task 1 Band</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    value={teacherTask1Band}
                    onChange={(e) => setTeacherTask1Band(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg p-2.5 text-sm font-mono font-bold text-foreground focus:ring-1 focus:ring-primary"
                    placeholder="e.g. 7.0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Task 2 Band</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="9"
                    value={teacherTask2Band}
                    onChange={(e) => setTeacherTask2Band(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg p-2.5 text-sm font-mono font-bold text-foreground focus:ring-1 focus:ring-primary"
                    placeholder="e.g. 8.0"
                  />
                </div>
              </div>

              {/* Feedback Textbox */}
              <div className="flex-1 flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Detailed Teacher Feedback</label>
                <textarea
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  required
                  rows={10}
                  className="flex-1 bg-card border border-border rounded-xl p-4 text-sm font-caption text-foreground leading-relaxed focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Provide structured feedback here regarding Task Response, Coherence & Cohesion, Lexical Resource, and Grammatical Range & Accuracy..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/faculty-dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" variant="default" disabled={savingReview} iconName="Check" className="font-bold">
                  {savingReview ? "Submitting Review..." : "Submit Student Review"}
                </Button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default StudentWritingReview;
