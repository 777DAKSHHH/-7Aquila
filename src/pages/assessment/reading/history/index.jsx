import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ReadingService } from "services/assessment/readingService";
import { useAuth } from "contexts/AuthContext";
import Button from "components/ui/Button";

const ReadingHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const res = await ReadingService.getStudentReadingHistory(user.id);
        if (res.success) {
          setHistory(res.data || []);
        } else {
          setError(res.error || "Failed to load history.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Reading Practice History
        </h1>
        <Button variant="outline" onClick={() => navigate("/assessment/reading/task-selection")}>
          New Test
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading history...</div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-center">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          You haven't taken any Reading tests yet.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase font-mono">Test Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase font-mono">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase font-mono">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase font-mono">Raw Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase font-mono">Band Score</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase font-mono">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {history.map((session) => (
                <tr key={session.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-foreground">
                    {session.reading_tests?.title || "Reading Practice Test"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground capitalize font-mono text-xs">
                    {session.reading_tests?.test_type || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(session.completed_at || session.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-mono">
                    {session.status === "completed" ? `${session.raw_score} / 40` : "Draft"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold font-mono text-primary">
                    {session.status === "completed" ? session.band_score : "In Progress"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {session.status === "completed" ? (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/assessment/reading/results/${session.id}`)}>
                        View Results
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/assessment/reading/test/${session.id}`)}>
                        Resume Test
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReadingHistory;
