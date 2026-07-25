import React, { useState } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import FacultyDashboard from './pages/faculty-dashboard';
import SpeakingTestInterface from './pages/speaking-test-interface';
import AIFeedbackResults from './pages/ai-feedback-results';
import StudentAudioReview from './pages/student-audio-review';
import StudentWritingReview from './pages/student-writing-review';
import PracticeHistory from './pages/practice-history';
import TestSelectionDashboard from './pages/test-selection-dashboard';
import LoginPage from "./pages/login/index.jsx";
import Lobby from "./pages/lobby/index.jsx";
import SignupPage from "./pages/signup/index.jsx";
import GatePage from "./pages/gate/index.jsx";
import Settings from "./pages/settings/index.jsx";
import AssessmentLayout from "./layouts/AssessmentLayout";
import { APP_ROUTES } from "./config/routes";

import WritingDashboard from "./pages/assessment/writing";
import WritingTaskSelection from "./pages/assessment/writing/task-selection";
import WritingTask1 from "./pages/assessment/writing/task1";
import WritingTask2 from "./pages/assessment/writing/task2";
import WritingHistory from "./pages/assessment/writing/history";
import WritingResults from "./pages/assessment/writing/results";

import ReadingDashboard from "./pages/assessment/reading";
import ReadingTaskSelection from "./pages/assessment/reading/task-selection";
import ReadingCbtTest from "./pages/assessment/reading/cbt";
import ReadingResults from "./pages/assessment/reading/results";
import ReadingHistory from "./pages/assessment/reading/history";

import ListeningDashboard from "./pages/assessment/listening";
import ListeningTaskSelection from "./pages/assessment/listening/task-selection";
import ListeningCbtTest from "./pages/assessment/listening/cbt";
import ListeningResults from "./pages/assessment/listening/results";
import ListeningHistory from "./pages/assessment/listening/history";

const Routes = () => {
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {!gateOpen && (
            <Route
              path="*"
              element={<GatePage onSuccess={() => setGateOpen(true)} />}
            />
          )}

          {gateOpen && (
            <>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
              <Route path="/speaking-test-interface" element={<SpeakingTestInterface />} />
              <Route path="/ai-feedback-results/:sessionId" element={<AIFeedbackResults />} />
              <Route path="/student-audio-review/:sessionId" element={<StudentAudioReview />} />
              <Route path="/student-writing-review/:sessionId" element={<StudentWritingReview />} />
              <Route path="/practice-history" element={<PracticeHistory />} />
              <Route path="/test-selection-dashboard" element={<TestSelectionDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route element={<AssessmentLayout />}>

                <Route
                  path={APP_ROUTES.WRITING}
                  element={<WritingDashboard />}
                />

                <Route
                  path={APP_ROUTES.WRITING_SELECTION}
                  element={<WritingTaskSelection />}
                />

                <Route
                  path={APP_ROUTES.WRITING_TASK1}
                  element={<WritingTask1 />}
                />

                <Route
                  path={APP_ROUTES.WRITING_TASK2}
                  element={<WritingTask2 />}
                />

                <Route
                  path={APP_ROUTES.WRITING_HISTORY}
                  element={<WritingHistory />}
                />

                <Route
                  path={APP_ROUTES.WRITING_RESULTS}
                  element={<WritingResults />}
                />

                <Route
                  path={APP_ROUTES.READING}
                  element={<ReadingDashboard />}
                />

                <Route
                  path={APP_ROUTES.READING_SELECTION}
                  element={<ReadingTaskSelection />}
                />

                <Route
                  path={APP_ROUTES.READING_TEST}
                  element={<ReadingCbtTest />}
                />

                <Route
                  path={APP_ROUTES.READING_RESULTS}
                  element={<ReadingResults />}
                />

                <Route
                  path={APP_ROUTES.READING_HISTORY}
                  element={<ReadingHistory />}
                />

                <Route
                  path={APP_ROUTES.LISTENING}
                  element={<ListeningDashboard />}
                />

                <Route
                  path={APP_ROUTES.LISTENING_SELECTION}
                  element={<ListeningTaskSelection />}
                />

                <Route
                  path={APP_ROUTES.LISTENING_TEST}
                  element={<ListeningCbtTest />}
                />

                <Route
                  path={APP_ROUTES.LISTENING_RESULTS}
                  element={<ListeningResults />}
                />

                <Route
                  path={APP_ROUTES.LISTENING_HISTORY}
                  element={<ListeningHistory />}
                />

              </Route>
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
