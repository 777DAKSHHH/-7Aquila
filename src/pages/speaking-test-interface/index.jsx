import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext.jsx";
import { supabase } from '../../supabaseClient';
import TopNav from '../../components/ui/TopNav';
import TestProgressIndicator from '../../components/ui/TestProgressIndicator';
import AudioRecordingPanel from '../../components/ui/AudioRecordingPanel';
import QuestionDisplay from './components/QuestionDisplay';
import CueCard from './components/CueCard';
import PreparationNotes from './components/PreparationNotes';
import TestTimer from './components/TestTimer';
import NavigationControls from './components/NavigationControls';
import ConfidenceBooster from './components/ConfidenceBooster';
import Icon from '../../components/AppIcon';
import AIEvaluationRunning from './components/AIEvaluationRunning';

const SpeakingTestInterface = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const testSetId = queryParams.get("testSetId");

  const [sessionId, setSessionId] = useState(null);
  const [showConfidenceBooster, setShowConfidenceBooster] = useState(true);
  const [currentPart, setCurrentPart] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [preparationNotes, setPreparationNotes] = useState('');
  const [isPreparationPhase, setIsPreparationPhase] = useState(false);
  const [preparationTimeLeft, setPreparationTimeLeft] = useState(75);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(120);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [recordingError, setRecordingError] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const recordingTimerRef = useRef(null);
  const preparationTimerRef = useRef(null);
  const speakingTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const getCurrentQuestionData = () => {
    // Ensure we don't show stale data from a previous part while fetching
    if (questions.length > 0 && questions[0]?.part != currentPart) {
      return {
        question: 'Loading...',
        topic: 'Loading...',
        bulletPoints: [],
        totalQuestions: 0,
        partTitle: currentPart === 1 ? 'Introduction' : (currentPart === 2 ? 'Long Turn' : 'Discussion')
      };
    }

    if (currentPart === 1) {
      return {
        question: questions[currentQuestion]?.question_text,
        totalQuestions: questions.length,
        partTitle: 'Introduction'
      };
    } else if (currentPart === 2) {
      const part2Question = questions[0];
      let topic = '';
      let bulletPoints = [];

      if (part2Question?.question_text) {
        const text = part2Question.question_text;
        const splitRegex = /you should say:?/i;
        const match = text.match(splitRegex);

        if (match) {
          topic = text.substring(0, match.index).trim();
          const bulletsText = text.substring(match.index + match[0].length).trim();
          // Split by comma, newline, or bullet points
          bulletPoints = bulletsText.split(/,|\n|•/).map(s => s.trim()).filter(s => s);
        } else {
          topic = text;
        }
      }

      return {
        topic: topic || 'Topic loading...',
        bulletPoints: bulletPoints,
        totalQuestions: 1,
        partTitle: 'Long Turn'
      };
    } else {
      return {
        question: questions[currentQuestion]?.question_text,
        totalQuestions: questions.length,
        partTitle: 'Discussion'
      };
    }
  };

  const getTotalQuestions = () => {
    // TODO: Fetch all question counts at the start for accuracy
    return 4 + 1 + 4;
  };

  const getCurrentQuestionNumber = () => {
    if (currentPart === 1) {
      return currentQuestion + 1;
    } else if (currentPart === 2) {
      // TODO: Fetch all question counts at the start for accuracy
      return 4 + 1;
    } else {
      // TODO: Fetch all question counts at the start for accuracy
      return 4 + 1 + currentQuestion + 1;
    }
  };

  useEffect(() => {
    const startSession = async () => {
      try {
        const response = await fetch("https://l-hit-aged7aquila.onrender.com/api/speaking/session/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          }
        });
  
        const data = await response.json();
  
        if (data.success && data.data?.id) {
          setSessionId(data.data.id);
        } else {
          console.error("Session ID not found in response");
        }
      } catch (error) {
        console.error("Error starting session:", error);
      }
    };
  
    startSession();
  }, []);

  useEffect(() => {
    if (!testSetId) return;

    fetch(`https://l-hit-aged7aquila.onrender.com/api/questions/set?testSetId=${testSetId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Filter by part on frontend
          const filtered = data.questions.filter(
            q => q.part == currentPart
          );

          setQuestions(filtered);
          // Reset question index when part changes to avoid out-of-bounds errors
          setCurrentQuestion(0);
        } else {
          console.error("Failed to load questions");
        }
      })
      .catch(err => {
        console.error("Error fetching questions:", err);
      });
  }, [currentPart, testSetId]);

  useEffect(() => {
    if (!isEvaluating || !sessionId) return;
  
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("speaking_sessions")
          .select("status")
          .eq("id", sessionId)
          .single();

        if (error) {
          console.error("Polling error:", error);
          return;
        }

        console.log("Polling status:", data?.status);

        if (data?.status === "evaluated") {
          if (!isMounted) return;

          // STOP LOADER
          setIsEvaluating(false);

          // REDIRECT
          navigate(`/ai-feedback-results/${sessionId}`, { replace: true });
        }

      } catch (err) {
        console.error("Polling failed:", err);
      }
    };
  
    // Run immediately (important UX fix)
    checkStatus();

    const interval = setInterval(checkStatus, 5000);
  
    // HARD SAFETY TIMEOUT (2 minutes max)
    const timeout = setTimeout(() => {
      console.warn("Polling timeout reached. Redirecting anyway...");
      setIsEvaluating(false);
      navigate(`/ai-feedback-results/${sessionId}`, { replace: true });
    }, 120000); // 120 sec

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isEvaluating, sessionId, navigate]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
        setAudioLevel(Math.random() * 100);
      }, 1000);
    } else {
      if (recordingTimerRef?.current) {
        clearInterval(recordingTimerRef?.current);
      }
    }

    return () => {
      if (recordingTimerRef?.current) {
        clearInterval(recordingTimerRef?.current);
      }
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (currentPart === 2 && isPreparationPhase && preparationTimeLeft > 0) {
      preparationTimerRef.current = setInterval(() => {
        setPreparationTimeLeft(prev => {
          if (prev <= 1) {
            setIsPreparationPhase(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (preparationTimerRef?.current) {
        clearInterval(preparationTimerRef?.current);
      }
    }

    return () => {
      if (preparationTimerRef?.current) {
        clearInterval(preparationTimerRef?.current);
      }
    };
  }, [currentPart, isPreparationPhase, preparationTimeLeft]);

  useEffect(() => {
    if (currentPart === 2 && !isPreparationPhase && isRecording && speakingTimeLeft > 0) {
      speakingTimerRef.current = setInterval(() => {
        setSpeakingTimeLeft(prev => {
          if (prev <= 1) {
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (speakingTimerRef?.current) {
        clearInterval(speakingTimerRef?.current);
      }
    }

    return () => {
      if (speakingTimerRef?.current) {
        clearInterval(speakingTimerRef?.current);
      }
    };
  }, [currentPart, isPreparationPhase, isRecording, speakingTimeLeft]);

  useEffect(() => {
    if (currentPart === 2) {
      setIsPreparationPhase(true);
      setPreparationTimeLeft(75);
      setSpeakingTimeLeft(120);
    }
  }, [currentPart]);

  const handleStartRecording = async () => {
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices?.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event?.data?.size > 0) {
          audioChunksRef?.current?.push(event?.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (!sessionId) {
          console.error("Session ID missing. Cannot upload audio.");
          return;
        }

        // Get current question ID safely
        const currentQuestionObject = questions[currentQuestion];
        if (!currentQuestionObject?.id) {
          console.error("Current question ID is missing. Cannot upload.");
          setAutoSaveStatus('error');
          return;
        }

        const formData = new FormData();
        formData.append("audio_file", audioBlob);
        formData.append("questionId", currentQuestionObject.id);
        formData.append("audioDuration", recordingTime);

        try {
          const response = await fetch(`https://l-hit-aged7aquila.onrender.com/api/speaking/session/${sessionId}/response`, {
            method: "POST",
            body: formData
          });
          const result = await response.json();
          console.log("Audio uploaded successfully:", result);
          setAutoSaveStatus('saved');
        } catch (error) {
          console.error("Audio upload failed:", error);
          setAutoSaveStatus('error');
        }

        stream?.getTracks()?.forEach(track => track?.stop());
      };

      mediaRecorderRef?.current?.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      setRecordingError('Unable to access microphone. Please check your browser permissions.');
      console.error('Recording error:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef?.current && isRecording) {
      mediaRecorderRef?.current?.stop();
      setIsRecording(false);
      setIsPaused(false);
      setAudioLevel(0);
    }
  };

  const handlePauseRecording = () => {
    if (mediaRecorderRef?.current && isRecording) {
      mediaRecorderRef?.current?.pause();
      setIsPaused(true);
    }
  };

  const handleResumeRecording = () => {
    if (mediaRecorderRef?.current && isPaused) {
      mediaRecorderRef?.current?.resume();
      setIsPaused(false);
    }
  };

  const handleNext = () => {
    if (currentPart === 1) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setRecordingTime(0);
      } else {
        setCurrentPart(2);
        setCurrentQuestion(0);
        setRecordingTime(0);
      }
    } else if (currentPart === 2) {
      setCurrentPart(3);
      setCurrentQuestion(0);
      setRecordingTime(0);
      setPreparationNotes('');
    } else if (currentPart === 3) {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setRecordingTime(0);
      }
    }
  };

  const handleBack = () => {
    if (currentPart === 1 && currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else if (currentPart === 2) {
      setCurrentPart(1);
      // TODO: This should be dynamic based on actual part 1 length
      setCurrentQuestion(4 - 1);
      setPreparationNotes('');
    } else if (currentPart === 3) {
      if (currentQuestion > 0) {
        setCurrentQuestion(prev => prev - 1);
      } else {
        setCurrentPart(2);
        setCurrentQuestion(0);
      }
    }
  };

  const handleSubmit = async () => {
    if (!sessionId) {
      console.error("No session ID found.");
      return;
    }
  
    try {
      console.log("Completing session...");
      setIsEvaluating(true);
  
      await fetch(
        `https://l-hit-aged7aquila.onrender.com/api/speaking/session/${sessionId}/complete`,
        {
          method: "POST"
        }
      );
  
      console.log("Triggering AI evaluation...");
  
      await fetch(
        `https://l-hit-aged7aquila.onrender.com/api/speaking/session/${sessionId}/evaluate-ai`,
        {
          method: "POST"
        }
      );
  
      console.log("AI evaluation triggered.");
  
    } catch (error) {
      console.error("Submit failed:", error);
      setIsEvaluating(false);
    }
  };

  const canGoBack = currentPart > 1 || (currentPart === 1 && currentQuestion > 0) || (currentPart === 3 && currentQuestion > 0);
  
  // FIX START
  // Determine if this is the absolute last question of the entire test (Part 3 end)
  // TODO: This should be dynamic based on actual part 3 length
  const isLastQuestionOfTest = currentPart === 3 && questions.length > 0 && currentQuestion === questions.length - 1;

  // Next button should be visible for all questions EXCEPT the very last one
  const canGoNext = !isLastQuestionOfTest;
  
  // Submit button should be visible ONLY on the very last question
  const canSubmit = isLastQuestionOfTest;
  // FIX END

  const questionData = getCurrentQuestionData();

  return (
    <div className="min-h-screen bg-background">
      <TopNav userRole="student" />
      {showConfidenceBooster && (
        <ConfidenceBooster 
          onClose={() => setShowConfidenceBooster(false)}
          autoCloseDelay={15000}
        />
      )}
      <main className="container-safe py-6 md:py-8 lg:py-10">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="Mic" size={24} color="var(--color-primary)" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-semibold text-foreground">
                IELTS Speaking Test
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-caption">
                Complete all three parts • Speak naturally and clearly
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {currentPart !== 2 ? (
              <QuestionDisplay
                part={currentPart}
                question={questionData?.question}
                questionNumber={currentQuestion + 1}
                totalQuestions={questionData?.totalQuestions}
                partTitle={questionData?.partTitle}
              />
            ) : (
              <CueCard
                topic={questionData?.topic}
                bulletPoints={questionData?.bulletPoints}
                isPreparationTime={isPreparationPhase}
                preparationTimeLeft={preparationTimeLeft}
              />
            )}

            {currentPart === 2 && isPreparationPhase && (
              <TestTimer
                timeLeft={preparationTimeLeft}
                totalTime={75}
                isActive={true}
                label="Preparation Time"
                variant="preparation"
              />
            )}

            {currentPart === 2 && !isPreparationPhase && isRecording && (
              <TestTimer
                timeLeft={speakingTimeLeft}
                totalTime={120}
                isActive={true}
                label="Speaking Time"
                variant="speaking"
              />
            )}

            <AudioRecordingPanel
              isRecording={isRecording}
              isPaused={isPaused}
              recordingTime={recordingTime}
              maxDuration={currentPart === 2 ? 120 : 60}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onPauseRecording={handlePauseRecording}
              onResumeRecording={handleResumeRecording}
              audioLevel={audioLevel}
              error={recordingError}
            />

            {currentPart === 2 && (
              <PreparationNotes
                notes={preparationNotes}
                onNotesChange={setPreparationNotes}
                isDisabled={!isPreparationPhase}
                maxLength={500}
              />
            )}

            <NavigationControls
              canGoBack={canGoBack}
              canGoNext={canGoNext}
              canSubmit={canSubmit}
              onBack={handleBack}
              onNext={handleNext}
              onSubmit={handleSubmit}
              isLoading={false}
              currentQuestion={getCurrentQuestionNumber()}
              totalQuestions={getTotalQuestions()}
              autoSaveStatus={autoSaveStatus}
            />
          </div>

          <div className="space-y-6 md:space-y-8">
            <TestProgressIndicator
              currentPart={currentPart}
              totalParts={3}
              currentQuestion={currentQuestion + 1}
              totalQuestions={questionData?.totalQuestions}
              partTitles={['Introduction', 'Long Turn', 'Discussion']}
            />

            <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Icon name="Lightbulb" size={20} color="var(--color-accent)" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground">
                  Quick Tips
                </h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <Icon name="Check" size={16} color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
                  <span>Speak at a natural pace - don't rush</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <Icon name="Check" size={16} color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
                  <span>Give detailed answers with examples</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <Icon name="Check" size={16} color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
                  <span>It's okay to pause and think</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <Icon name="Check" size={16} color="var(--color-success)" className="flex-shrink-0 mt-0.5" />
                  <span>Use a variety of vocabulary</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/5 rounded-lg p-6 border border-primary/10">
              <div className="flex items-start gap-3">
                <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">
                    Recording Status
                  </p>
                  <p className="text-sm text-muted-foreground font-caption leading-relaxed">
                    Your responses are being recorded and will be automatically saved. You can review them after completing the test.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {isEvaluating && <AIEvaluationRunning />}
    </div>
  );
};

export default SpeakingTestInterface;
