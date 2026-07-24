import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import { supabase } from "../../../../../supabaseClient";
import { QuestionService } from "../../../../../services/assessment/questionService";
import { SessionService } from "../../../../../services/assessment/sessionService";
import { APP_ROUTES } from "../../../../../config/routes";

/**
 * Custom hook encapsulating Task 1 Selection business logic,
 * filtering, live statistics, question preview count, and session creation workflow.
 */
export const useTaskSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  // Filter state
  const [difficulty, setDifficulty] = useState("all");
  const [questionType, setQuestionType] = useState("all");

  // Statistics state
  const [stats, setStats] = useState({
    totalActive: 0,
    totalQuestions: 0,
    distinctTypesCount: 0,
    questionTypes: [],
  });

  // Preview / Matching Question Count state
  const [availableCount, setAvailableCount] = useState(0);

  // Initial load: Fetch overall question bank stats
  useEffect(() => {
    let isMounted = true;

    const fetchInitialStats = async () => {
      setLoading(true);
      setError(null);

      const statsRes = await QuestionService.getWritingTask1Stats();

      if (!isMounted) return;

      if (!statsRes.success) {
        setError(statsRes.error || "Failed to load question bank statistics.");
        setLoading(false);
        return;
      }

      setStats(statsRes.data);
      setLoading(false);
    };

    fetchInitialStats();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter change load: Update matching question count
  useEffect(() => {
    let isMounted = true;

    const fetchMatchingCount = async () => {
      const filters = { difficulty, question_type: questionType };
      const countRes = await QuestionService.getFilteredQuestionsCount(
        "writing_task1",
        filters
      );

      if (!isMounted) return;

      if (!countRes.success) {
        console.error("Error fetching filtered count:", countRes.error);
        setAvailableCount(0);
        return;
      }

      setAvailableCount(countRes.count);
    };

    fetchMatchingCount();

    return () => {
      isMounted = false;
    };
  }, [difficulty, questionType]);

  // Start Session Workflow
  const handleStartSession = useCallback(async () => {
    // 1. Obtain active authenticated Supabase User
    let activeUser = user;

    if (!activeUser) {
      const { data: authData } = await supabase.auth.getUser();
      activeUser = authData?.user;
    }

    if (!activeUser || !activeUser.id) {
      setError("Authentication required to create a practice session. Please log in first.");
      return;
    }

    if (availableCount === 0) {
      setError(
        "No active questions available matching your current filters. Please adjust your criteria."
      );
      return;
    }

    setStarting(true);
    setError(null);

    try {
      // 2. Select random question matching current filters
      const filters = { difficulty, question_type: questionType };
      const randomRes = await QuestionService.getRandomQuestion(
        "writing_task1",
        filters
      );

      if (!randomRes.success || !randomRes.data) {
        throw new Error(
          randomRes.error || "Failed to select a question for the session."
        );
      }

      const selectedQuestion = randomRes.data;

      // 3. Create writing_sessions record in Supabase using authenticated student ID
      const sessionRes = await SessionService.createWritingSession({
        studentId: activeUser.id,
        task1QuestionId: selectedQuestion.id,
      });

      if (!sessionRes.success || !sessionRes.data) {
        throw new Error(
          sessionRes.error || "Failed to create writing session in Supabase."
        );
      }

      const session = sessionRes.data;

      // 4. Navigate to Writing Task 1 route with session UUID query parameter
      const targetPath = APP_ROUTES.WRITING_TASK1 || "/assessment/writing/task1";
      navigate(`${targetPath}?session=${session.id}`);
    } catch (err) {
      console.error("useTaskSelection handleStartSession Error:", err);
      setError(
        err.message || "An unexpected error occurred while starting the session."
      );
    } finally {
      setStarting(false);
    }
  }, [user, availableCount, difficulty, questionType, navigate]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    starting,
    error,
    clearError,
    difficulty,
    setDifficulty,
    questionType,
    setQuestionType,
    stats,
    availableCount,
    handleStartSession,
  };
};

export default useTaskSelection;
