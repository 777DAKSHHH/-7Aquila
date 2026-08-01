import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReadingService } from "services/assessment/readingService";
import { useAuth } from "contexts/AuthContext";
import Button from "components/ui/Button";

const QUESTION_TYPE_LABELS = {
  tfng: "True / False / Not Given",
  ynng: "Yes / No / Not Given",
  mcq_single: "Multiple Choice (Single)",
  mcq_multiple: "Multiple Choice (Multiple)",
  matching_headings: "Matching Headings",
  matching_info: "Matching Information",
  matching_features: "Matching Features",
  sentence_completion: "Sentence Completion",
  summary_completion: "Summary Completion",
  short_answer: "Short Answer",
  diagram_labeling: "Diagram Labelling",
  table_completion: "Table Completion"
};

const ReadingTaskSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedQuestionType, setSelectedQuestionType] = useState("all");

  useEffect(() => {
    const fetchTests = async () => {
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

  const handleStartTest = async (testId) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await ReadingService.createReadingSession({
        studentId: user.id,
        readingTestId: testId
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

  // Determine if a test is newly added (created in the last 14 days)
  const isNewTest = (createdAt) => {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const diffTime = Math.abs(new Date() - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  };

  // Get all unique question types present in the loaded tests
  const availableQuestionTypes = Array.from(
    new Set(
      tests.flatMap(t => 
        t.reading_passages?.flatMap(p => 
          p.reading_questions?.map(q => q.question_type)
        ) || []
      )
    )
  ).filter(Boolean);

  // Filter tests list based on selections
  const filteredTests = tests.filter((test) => {
    if (selectedType !== "all" && test.test_type !== selectedType) {
      return false;
    }
    if (selectedDifficulty !== "all" && test.difficulty !== selectedDifficulty) {
      return false;
    }
    if (selectedQuestionType !== "all") {
      const hasQType = test.reading_passages?.some((p) =>
        p.reading_questions?.some((q) => q.question_type === selectedQuestionType)
      );
      if (!hasQType) return false;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground mb-2">
          Select Reading Test
        </h1>
        <p className="text-sm text-muted-foreground font-caption">
          Select a full test or practice specific IELTS question types to improve your band score.
        </p>
      </div>

      {/* Filters Panel */}
      <div className="flex flex-col md:flex-row gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase font-mono">Test Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground outline-none focus:border-primary transition duration-base"
          >
            <option value="all">All Types</option>
            <option value="academic">Academic</option>
            <option value="general">General</option>
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase font-mono">Difficulty</label>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground outline-none focus:border-primary transition duration-base"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="intermediate">Intermediate</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase font-mono">Question Focus</label>
          <select
            value={selectedQuestionType}
            onChange={(e) => setSelectedQuestionType(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground outline-none focus:border-primary transition duration-base"
          >
            <option value="all">All Question Types</option>
            {availableQuestionTypes.map((qType) => (
              <option key={qType} value={qType}>
                {QUESTION_TYPE_LABELS[qType] || qType.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tests...</div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-center">
          {error}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          No active reading tests match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTests.map((test) => {
            const passageCount = test.reading_passages?.length || 0;
            const totalQuestions = test.reading_passages?.reduce(
              (sum, p) => sum + (p.reading_questions?.length || 0), 0
            ) || 0;
            const isPracticePassage = passageCount === 1;

            // Get unique question types for this specific test
            const testQuestionTypes = Array.from(
              new Set(
                test.reading_passages?.flatMap(p => 
                  p.reading_questions?.map(q => q.question_type)
                ) || []
              )
            ).filter(Boolean);

            return (
              <div key={test.id} className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-primary transition duration-base">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-mono tracking-wider text-primary font-semibold">
                        {test.test_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                        isPracticePassage 
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30" 
                          : "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                      }`}>
                        {isPracticePassage ? "Practice Passage" : "Full Exam"}
                      </span>
                      {isNewTest(test.created_at) && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 animate-pulse">
                          New Added
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground capitalize">
                      {test.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-heading font-bold text-foreground">
                    {test.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Duration: {test.duration_minutes} Minutes | {passageCount} {passageCount === 1 ? "Passage" : "Passages"} | {totalQuestions || 40} Questions
                  </p>
                  {testQuestionTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {testQuestionTypes.map((qType) => (
                        <span key={qType} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium font-caption bg-muted text-muted-foreground border border-border/80">
                          {QUESTION_TYPE_LABELS[qType] || qType.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="pt-4">
                  <Button variant="primary" fullWidth onClick={() => handleStartTest(test.id)}>
                    {isPracticePassage ? "Start Practice" : "Start Full Test"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReadingTaskSelection;
