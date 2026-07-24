import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import { APP_ROUTES } from "../../../config/routes";

const ListeningDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-4">
        <h1 className="text-3xl font-heading font-bold text-foreground">
          IELTS Listening Module
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Welcome to the Computer-Based Test (CBT) Listening practice module. You will listen to 4 audio recordings of native English speakers and write your answers to a series of 40 questions within 30 minutes.
        </p>

        <div className="flex gap-4 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(APP_ROUTES.LISTENING_SELECTION || "/assessment/listening/task-selection")}
          >
            Start Practice
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(APP_ROUTES.LISTENING_HISTORY || "/assessment/listening/history")}
          >
            View History
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ListeningDashboard;
