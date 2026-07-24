import { useState, useEffect, useRef, useCallback } from "react";
import { TimerService } from "../../../../../services/assessment/timerService";
import { SessionService } from "../../../../../services/assessment/sessionService";
import { TASK1_DEFAULTS } from "../constants/task1Constants";

/**
 * Custom hook managing the Writing Task 1 Timer Engine lifecycle (Sprint 2 - Phase 3).
 *
 * Responsibilities:
 * - Restores timer countdown from stored session data without resetting to 20 mins on refresh.
 * - Manages single TimerService instance with timestamp-based drift prevention.
 * - Periodically syncs remaining/elapsed seconds to Supabase via SessionService.
 * - Provides warning threshold states (normal, warning, critical, expired).
 * - Handles timer expiration and cleanup.
 */
export const useTask1Timer = ({
  sessionId,
  initialTimeSeconds = 0,
  duration = TASK1_DEFAULTS.TIME_LIMIT_SECONDS, // 1200 seconds (20 min)
  onExpire,
}) => {
  // Determine remaining seconds on mount (accounting for elapsed seconds in DB)
  const calculateInitialRemaining = useCallback(() => {
    const elapsed = typeof initialTimeSeconds === "number" ? Math.max(0, initialTimeSeconds) : 0;
    // If elapsed is less than duration, remaining = duration - elapsed
    if (elapsed < duration) {
      return duration - elapsed;
    }
    // If elapsed >= duration, session time has already expired
    return 0;
  }, [initialTimeSeconds, duration]);

  const [remainingSeconds, setRemainingSeconds] = useState(calculateInitialRemaining);
  const [formattedTime, setFormattedTime] = useState("20:00");
  const [warningState, setWarningState] = useState("normal");
  const [isExpired, setIsExpired] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const timerRef = useRef(null);

  // Sync remaining seconds back to Supabase database
  const syncTimerToDatabase = useCallback(
    async (currentRemaining) => {
      if (!sessionId) return;

      const elapsedSeconds = Math.max(0, duration - currentRemaining);

      try {
        await SessionService.updateWritingSession(sessionId, {
          task1_time_seconds: elapsedSeconds,
          total_time_seconds: elapsedSeconds,
        });
      } catch (err) {
        console.error("useTask1Timer Database Sync Error:", err);
      }
    },
    [sessionId, duration]
  );

  // Initialize and start timer engine instance
  useEffect(() => {
    if (!sessionId) return;

    const startRemaining = calculateInitialRemaining();
    setRemainingSeconds(startRemaining);

    // If already expired on load
    if (startRemaining <= 0) {
      setIsExpired(true);
      setWarningState("expired");
      setFormattedTime("00:00");
      return;
    }

    // Clean up any existing timer instance before creating a new one
    if (timerRef.current) {
      timerRef.current.stop();
    }

    const timerInstance = new TimerService({
      duration,
      remainingSeconds: startRemaining,
      syncIntervalSeconds: 15, // Sync to DB every 15 seconds
      onTick: (sec, timeObj) => {
        setRemainingSeconds(sec);
        setFormattedTime(timeObj.formatted);
        setWarningState(timerInstance.getWarningState());
      },
      onSync: (sec) => {
        syncTimerToDatabase(sec);
      },
      onComplete: () => {
        setIsExpired(true);
        setIsRunning(false);
        setWarningState("expired");
        setFormattedTime("00:00");
        syncTimerToDatabase(0);
        onExpire?.();
      },
    });

    timerRef.current = timerInstance;
    timerInstance.start();
    setIsRunning(true);
    setWarningState(timerInstance.getWarningState());
    setFormattedTime(timerInstance.getRemainingTime().formatted);

    // Cleanup on unmount or session change
    return () => {
      if (timerRef.current) {
        // Perform final sync on unmount
        const currentRemaining = timerRef.current.getRemainingSeconds();
        syncTimerToDatabase(currentRemaining);
        timerRef.current.stop();
        timerRef.current = null;
      }
      setIsRunning(false);
    };
  }, [sessionId, calculateInitialRemaining, duration, syncTimerToDatabase, onExpire]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      timerRef.current.pause();
      setIsRunning(false);
    }
  }, []);

  const resumeTimer = useCallback(() => {
    if (timerRef.current && !isExpired) {
      timerRef.current.resume();
      setIsRunning(true);
    }
  }, [isExpired]);

  return {
    remainingSeconds,
    formattedTime,
    warningState,
    isExpired,
    isRunning,
    pauseTimer,
    resumeTimer,
  };
};

export default useTask1Timer;
