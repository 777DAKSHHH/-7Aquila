import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { APP_ROUTES } from "../../../config/routes";

const ReadingDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-4">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          IELTS Reading Module
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Welcome to the Computer-Based Test (CBT) Reading practice module. You will face 3 sections containing academic or general passages, with 40 questions to answer within 60 minutes.
        </p>

        <div className="flex gap-4 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(APP_ROUTES.READING_SELECTION || "/assessment/reading/task-selection")}
          >
            Start Practice
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(APP_ROUTES.READING_HISTORY || "/assessment/reading/history")}
          >
            View History
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReadingDashboard;
