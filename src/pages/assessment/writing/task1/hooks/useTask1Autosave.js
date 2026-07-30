import { useState, useEffect, useRef, useCallback } from "react";
import {
  AutoSaveService,
  registerVisibilitySave,
  registerBeforeUnload,
} from "../../../../../services/assessment/autosaveService";
import { SessionService } from "../../../../../services/assessment/sessionService";

/**
 * Custom hook for Task 1 Autosave Engine (Sprint 2 - Phase 5).
 *
 * Responsibilities:
 * - Manages AutoSaveService instance for Task 1 session.
 * - Triggers debounced save when answer text or word count changes.
 * - Registers tab visibility and beforeunload handlers.
 * - Exposes rich observable autosave state to presentation UI.
 */
export const useTask1Autosave = ({ sessionId, answer, wordCount }) => {
  const [autosaveState, setAutosaveState] = useState({
    status: "idle", // 'idle' | 'typing' | 'saving' | 'saved' | 'retrying' | 'failed'
    lastSavedAt: null,
    pendingChanges: false,
    retryCount: 0,
    isDirty: false,
    hasUnsavedChanges: false,
    error: null,
  });

  const autosaveRef = useRef(null);
  const isFirstRender = useRef(true);
  const latestDataRef = useRef({ answer, wordCount });

  // Sync latest answer and wordCount to ref on every update
  useEffect(() => {
    latestDataRef.current = { answer, wordCount };
  }, [answer, wordCount]);

  // Initialize AutoSaveService instance
  useEffect(() => {
    if (!sessionId) return;

    const instance = new AutoSaveService({
      delay: 2500, // 2.5s debounce delay
      maxRetries: 3,
      saveFunction: async (data) => {
        return await SessionService.saveWritingDraft(sessionId, data);
      },
      onStatusChange: (newState) => {
        setAutosaveState({ ...newState });
      },
    });

    autosaveRef.current = instance;

    // Register tab visibility & unload handlers
    const getCurrentData = () => ({
      task1_answer: latestDataRef.current.answer,
      task1_word_count: latestDataRef.current.wordCount,
    });

    const unbindVisibility = registerVisibilitySave(instance, getCurrentData);
    const unbindUnload = registerBeforeUnload(instance, getCurrentData);

    return () => {
      unbindVisibility();
      unbindUnload();
      if (autosaveRef.current) {
        autosaveRef.current.destroy();
        autosaveRef.current = null;
      }
    };
  }, [sessionId]);

  // Detect answer text or word count changes
  useEffect(() => {
    if (!sessionId || !autosaveRef.current) return;

    // Skip initial hydration trigger
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    autosaveRef.current.markAsChanged({
      task1_answer: answer,
      task1_word_count: wordCount,
    });
  }, [sessionId, answer, wordCount]);

  // Force immediate save action
  const forceSave = useCallback(async () => {
    if (autosaveRef.current) {
      await autosaveRef.current.forceSave({
        task1_answer: latestDataRef.current.answer,
        task1_word_count: latestDataRef.current.wordCount,
      });
    }
  }, []);

  // Manual retry action
  const manualRetry = useCallback(async () => {
    if (autosaveRef.current) {
      await autosaveRef.current.save(
        {
          task1_answer: latestDataRef.current.answer,
          task1_word_count: latestDataRef.current.wordCount,
        },
        true
      );
    }
  }, []);

  return {
    autosaveState,
    forceSave,
    manualRetry,
  };
};

export default useTask1Autosave;
