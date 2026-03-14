import React, { useState } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import FacultyDashboard from './pages/faculty-dashboard';
import SpeakingTestInterface from './pages/speaking-test-interface';
import AIFeedbackResults from './pages/ai-feedback-results';
import StudentAudioReview from './pages/student-audio-review';
import PracticeHistory from './pages/practice-history';
import TestSelectionDashboard from './pages/test-selection-dashboard';
import LoginPage from "./pages/login/index.jsx";
import Lobby from "./pages/lobby/index.jsx";
import SignupPage from "./pages/signup/index.jsx";
import GatePage from "./pages/gate/index.jsx";

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
              <Route path="/ai-feedback-results/:attemptId" element={<AIFeedbackResults />} />
              <Route path="/student-audio-review" element={<StudentAudioReview />} />
              <Route path="/student-audio-review/:attemptId" element={<StudentAudioReview />} />
              <Route path="/practice-history" element={<PracticeHistory />} />
              <Route path="/test-selection-dashboard" element={<TestSelectionDashboard />} />
              <Route path="*" element={<NotFound />} />
            </>
          )}
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
