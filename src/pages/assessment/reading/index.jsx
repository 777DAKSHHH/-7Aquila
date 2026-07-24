import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { supabase } from "../../../supabaseClient";
import { ReadingService } from "../../../services/assessment/readingService";
import TopNav from "../../../components/ui/TopNav";
import AppIcon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

const DIFFICULTY_OPTIONS = [
  { value: "all", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "academic", label: "Academic" },
  { value: "general", label: "General" },
];

const ReadingDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");
  const [draftSession, setDraftSession] = useState(null);

  const [stats, setStats] = useState({
    totalSessions: 0,
    completedCount: 0,
    averageScore: "0.0",
    recentScore: "0.0",
  });

  // Fetch Tests
  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const res = await ReadingService.getReadingTests();
        if (res.success) {
          setTests(res.data || []);
        } else {
          setError(res.error || "Failed to load tests.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  // Fetch User Stats
  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from("reading_sessions")
          .select("*")
          .eq("student_id", user.id)
          .order("completed_at", { ascending: false });

        if (error) throw error;

        if (sessions) {
          const completed = sessions.filter((s) => s.status === "completed" || s.completed_at);
          const totalScore = completed.reduce((sum, s) => sum + (s.band_score || 0), 0);
          const averageScore = completed.length > 0 ? (totalScore / completed.length).toFixed(1) : "0.0";
          const recentScore = completed.length > 0 ? (completed[0].band_score || 0).toFixed(1) : "0.0";

          setStats({
            totalSessions: sessions.length,
            completedCount: completed.length,
            averageScore,
            recentScore,
          });

          // Check for incomplete draft
          const activeDraft = sessions.find((s) => s.status === "in_progress" || !s.completed_at);
          setDraftSession(activeDraft || null);
        }
      } catch (err) {
        console.error("Error fetching reading stats:", err);
      }
    };

    fetchStats();
  }, [user]);

  // Start reading session
  const handleStartTest = async (testId) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await ReadingService.createReadingSession({
        studentId: user.id,
        readingTestId: testId,
      });
      if (res.success) {
        navigate(`/assessment/reading/test/${res.data.id}`);
      } else {
        alert(res.error || "Could not launch test session.");
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
    navigate(`/assessment/reading/test/${draftSession.id}`);
  };

  // Filter tests
  const filteredTests = tests.filter((test) => {
    // Search query filter
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      const matchTitle = (test.title || "").toLowerCase().includes(query);
      const matchType = (test.test_type || "").toLowerCase().includes(query);
      if (!matchTitle && !matchType) return false;
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      if (test.difficulty?.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;
    }

    // Module filter
    if (selectedModule !== "all") {
      if (test.test_type?.toLowerCase() !== selectedModule.toLowerCase()) return false;
    }

    return true;
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
          
          {/* Header & Subtitle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground font-display">
                Reading CBT Dashboard
              </h1>
              <p className="text-muted-foreground mt-1 font-caption">
                Practice IELTS Reading passages and questions on our authentic computer-based testing interface.
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
                Resume Active Practice
              </Button>
            )}
          </div>

          {/* Stats Summary Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg text-primary">
                <AppIcon name="Activity" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-caption text-muted-foreground uppercase tracking-wider font-semibold">Total Attempts</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.totalSessions}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-600">
                <AppIcon name="CheckCircle2" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-caption text-muted-foreground uppercase tracking-wider font-semibold">Completed</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{stats.completedCount}</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-600">
                <AppIcon name="Award" size={24} />
              </div>
              <div>
                <p className="text-[11px] font-caption text-muted-foreground uppercase tracking-wider font-semibold">Avg Band Score</p>
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

          {/* Interactive Filters Panel */}
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <AppIcon name="Filter" size={18} className="text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Filter Test Bank</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                type="search"
                placeholder="Search tests by title or code..."
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
                options={MODULE_OPTIONS}
                value={selectedModule}
                onChange={(val) => setSelectedModule(val)}
                placeholder="Select Module"
              />
            </div>
          </div>

          {/* Questions Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse animate-duration-1000" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-6 text-center">
              {error}
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground shadow-sm">
              <AppIcon name="Inbox" size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-foreground">No reading tests available</p>
              <p className="text-xs text-muted-foreground mt-1">Try resetting your filters or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTests.map((test) => {
                const passageCount = test.reading_passages?.length || 0;
                const totalQuestions = test.reading_passages?.reduce(
                  (sum, p) => sum + (p.reading_questions?.length || 0), 0
                ) || 0;
                const isPracticePassage = passageCount === 1;

                return (
                  <div
                    key={test.id}
                    className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-xs hover:border-primary transition duration-base"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-primary font-bold bg-primary/10 p-1.5 rounded-lg">
                            {test.test_type}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                            isPracticePassage 
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            {isPracticePassage ? "Single Passage" : "Full Test"}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${getDifficultyBadge(test.difficulty)}`}>
                          {test.difficulty}
                        </span>
                      </div>

                      <h3 className="text-lg font-heading font-semibold text-foreground line-clamp-1 mb-2">
                        {test.title}
                      </h3>

                      <p className="text-xs text-muted-foreground mb-4">
                        Passages in this test cover general, scientific, and academic topics. Spend about {isPracticePassage ? "20" : "60"} minutes.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-4">
                      <div className="flex gap-3 text-[11px] text-muted-foreground font-semibold">
                        <span className="flex items-center gap-1">
                          <AppIcon name="BookOpen" size={13} />
                          {passageCount} {passageCount === 1 ? "Passage" : "Passages"}
                        </span>
                        <span className="flex items-center gap-1">
                          <AppIcon name="HelpCircle" size={13} />
                          {totalQuestions || 40} Questions
                        </span>
                      </div>

                      <Button
                        variant="default"
                        onClick={() => handleStartTest(test.id)}
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

export default ReadingDashboard;
