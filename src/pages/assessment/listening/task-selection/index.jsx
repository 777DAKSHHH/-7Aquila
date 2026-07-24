import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ListeningService } from "services/assessment/listeningService";
import { useAuth } from "contexts/AuthContext";
import Button from "components/ui/Button";

const ListeningTaskSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await ListeningService.getListeningTests();
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
      const res = await ListeningService.createListeningSession({
        studentId: user.id,
        listeningTestId: testId
      });
      if (res.success) {
        navigate(`/assessment/listening/test/${res.data.id}`);
      } else {
        alert(res.error || "Could not launch test session.");
      }
    } catch (err) {
      alert("Error starting test: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Select Listening Test
        </h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tests...</div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-center">
          {error}
        </div>
      ) : tests.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          No active listening tests available.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests.map((test) => {
            const sectionCount = test.listening_sections?.length || 0;
            const totalQuestions = test.listening_sections?.reduce(
              (sum, s) => sum + (s.listening_questions?.length || 0), 0
            ) || 0;

            return (
              <div key={test.id} className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm hover:border-primary transition duration-base">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-mono tracking-wider text-primary font-semibold">
                      Listening Test
                    </span>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground capitalize">
                      {test.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-heading font-bold text-foreground">
                    {test.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Duration: {test.duration_minutes} Minutes | {sectionCount} Parts | {totalQuestions || 40} Questions
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="primary" fullWidth onClick={() => handleStartTest(test.id)}>
                    Start Listening Exam
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

export default ListeningTaskSelection;
