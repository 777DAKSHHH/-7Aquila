import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { supabase } from "../../../supabaseClient";
import TopNav from "../../../components/ui/TopNav";
import AppIcon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { QuestionService } from "../../../services/assessment/questionService";
import { SessionService } from "../../../services/assessment/sessionService";
import { APP_ROUTES } from "../../../config/routes";

const TASK1_TYPES = [
  { value: "all", label: "All Types" },
  { value: "bar_graph", label: "Bar Graph" },
  { value: "line_chart", label: "Line Graph" },
  { value: "pie_chart", label: "Pie Chart" },
  { value: "table", label: "Table" },
  { value: "map", label: "Map" },
  { value: "process", label: "Process" },
  { value: "cycle", label: "Cycle" },
];

const TASK2_TYPES = [
  { value: "all", label: "All Types" },
  { value: "opinion", label: "Opinion / Agree or Disagree" },
  { value: "discussion", label: "Discuss Both Sides" },
  { value: "advantage_disadvantage", label: "Advantages & Disadvantages" },
  { value: "problem_solution", label: "Problem & Solution" },
  { value: "double_question", label: "Double Question" },
];

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const WritingSelectionDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("task1"); // 'task1' | 'task2'
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [draftSession, setDraftSession] = useState(null);

  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    recentScore: 0,
    completedTests: 0,
  });

  // Fetch Stats & Drafts
  useEffect(() => {
    if (!user) return;

    const fetchStatsAndDrafts = async () => {
      try {
        // Fetch sessions
        const { data: sessions, error } = await supabase
          .from("writing_sessions")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (sessions) {
          const completed = sessions.filter(
            (s) => s.status === "evaluated" || s.status === "reviewed"
          );
          
          const totalScore = completed.reduce((sum, s) => sum + (s.overall_band || 0), 0);
          const averageScore = completed.length > 0 ? (totalScore / completed.length).toFixed(1) : "0.0";
          const recentScore = completed.length > 0 ? (completed[0].overall_band || 0).toFixed(1) : "0.0";

          setStats({
            totalTests: sessions.length,
            completedTests: completed.length,
            averageScore,
            recentScore,
          });

          // Look for active draft
          const activeDraft = sessions.find((s) => s.is_draft === true);
          setDraftSession(activeDraft || null);
        }
      } catch (err) {
        console.error("Error fetching writing stats:", err);
      }
    };

    fetchStatsAndDrafts();
  }, [user]);

  // Fetch Questions when tab or filters change
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const moduleKey = activeTab === "task1" ? "writing_task1" : "writing_task2";
        const filters = {
          difficulty: selectedDifficulty,
          question_type: selectedType,
        };
        const res = await QuestionService.getQuestions(moduleKey, filters);
        if (res.success) {
          setQuestions(res.data || []);
        } else {
          console.error("Failed to load questions:", res.error);
        }
      } catch (err) {
        console.error("Error loading questions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [activeTab, selectedDifficulty, selectedType]);

  // Reset type filter when switching tabs
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedType("all");
    setSelectedDifficulty("all");
    setSearchQuery("");
  };

  // Launch a session
  const handleStartTest = async (questionId) => {
    if (!user) return;
    try {
      setLoading(true);
      const isTask1 = activeTab === "task1";
      const payload = {
        studentId: user.id,
        task1QuestionId: isTask1 ? questionId : null,
        task2QuestionId: isTask1 ? null : questionId,
      };

      const res = await SessionService.createWritingSession(payload);
      if (res.success && res.data) {
        const targetRoute = isTask1 ? "/assessment/writing/task1" : "/assessment/writing/task2";
        navigate(`${targetRoute}?session=${res.data.id}`);
      } else {
        alert(res.error || "Failed to create practice session.");
      }
    } catch (err) {
      alert("Error starting test: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resume active draft
  const handleResumeDraft = () => {
    if (!draftSession) return;
    const isTask1 = !!draftSession.task1_question_id;
    const targetRoute = isTask1 ? "/assessment/writing/task1" : "/assessment/writing/task2";
    navigate(`${targetRoute}?session=${draftSession.id}`);
  };

  // Client-side search filtering
  const filteredQuestions = questions.filter((q) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const titleMatch = (q.title || "").toLowerCase().includes(query);
    const codeMatch = (q.question_code || "").toLowerCase().includes(query);
    const textMatch = (q.question_text || "").toLowerCase().includes(query);
    return titleMatch || codeMatch || textMatch;
  });

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case "easy":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
      case "hard":
        return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="student" />
      <main className="container-safe py-6 md:py-8 lg:py-12">
        <div className="space-y-8">
          
          {/* Header & Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                Writing CBT Dashboard
              </h1>
              <p className="text-muted-foreground mt-1 font-caption">
                Practice IELTS Writing Task 1 (Reports) and Task 2 (Essays) under exam conditions.
              </p>
            </div>

            {draftSession && (
              <Button
                variant="outline"
                size="md"
                onClick={handleResumeDraft}
                iconName="Play"
                className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/70"
              >
                Resume Active Draft
              </Button>
            )}
          </div>

          {/* Statistics panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <AppIcon name="Activity" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-caption text-muted-foreground uppercase tracking-wider font-semibold">Total Sessions</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.totalTests}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                <AppIcon name="CheckCircle2" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-caption text-muted-foreground uppercase tracking-wider font-semibold">Evaluated Tests</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.completedTests}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-600">
                <AppIcon name="Award" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-caption text-muted-foreground uppercase tracking-wider font-semibold">Average Band</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.averageScore}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-accent/20 rounded-lg text-accent-foreground">
                <AppIcon name="TrendingUp" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-caption text-muted-foreground uppercase tracking-wider font-semibold">Recent Score</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.recentScore}</p>
              </div>
            </div>
          </div>

          {/* Module Selector Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => handleTabChange("task1")}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "task1"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <AppIcon name="FileText" size={16} />
              Task 1 (Academic Reports)
            </button>
            <button
              onClick={() => handleTabChange("task2")}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === "task2"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <AppIcon name="Edit3" size={16} />
              Task 2 (Academic/General Essays)
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <AppIcon name="Filter" size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Filter Test Bank</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="search"
                placeholder="Search by topic, code, or prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <Select
                options={DIFFICULTY_OPTIONS}
                value={selectedDifficulty}
                onChange={(val) => setSelectedDifficulty(val)}
                placeholder="Select Difficulty"
              />

              <Select
                options={activeTab === "task1" ? TASK1_TYPES : TASK2_TYPES}
                value={selectedType}
                onChange={(val) => setSelectedType(val)}
                placeholder="Select Question Type"
              />
            </div>
          </div>

          {/* Grid of Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-card border border-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              <AppIcon name="Inbox" size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground">No questions found</p>
              <p className="text-xs text-muted-foreground mt-1">Adjust your filter choices or search query and try again.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuestions.map((q) => {
                const limitMinutes = q.recommended_time_minutes || (activeTab === "task1" ? 20 : 40);
                const minWords = q.min_words || (activeTab === "task1" ? 150 : 250);

                return (
                  <div
                    key={q.id}
                    className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition duration-base"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="p-1.5 px-2.5 bg-primary/10 text-primary font-mono text-[10px] font-bold rounded-lg tracking-wider">
                          {q.question_code}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${getDifficultyBadge(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                      </div>

                      <h3 className="text-lg font-heading font-semibold text-foreground line-clamp-1 mb-2">
                        {q.title || "IELTS Writing Question"}
                      </h3>
                      
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                        {q.question_text || q.prompt || q.description}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Requirements display */}
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground border-t border-border/50 pt-3">
                        <span className="flex items-center gap-1">
                          <AppIcon name="Clock" size={13} />
                          {limitMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <AppIcon name="FileText" size={13} />
                          {minWords}+ words
                        </span>
                        {q.estimated_band && (
                          <span className="flex items-center gap-1">
                            <AppIcon name="Award" size={13} />
                            Band {q.estimated_band}
                          </span>
                        )}
                      </div>

                      <Button
                        variant="default"
                        fullWidth
                        onClick={() => handleStartTest(q.id)}
                        iconName="Play"
                      >
                        Start Test
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default WritingSelectionDashboard;