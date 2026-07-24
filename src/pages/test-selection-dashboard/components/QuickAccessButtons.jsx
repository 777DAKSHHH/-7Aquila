import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const QuickAccessButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3">
      {/* Module Shortcuts */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="primary"
          size="sm"
          iconName="FileText"
          iconPosition="left"
          onClick={() => navigate('/assessment/writing')}
          fullWidth
        >
          Writing
        </Button>
        <Button
          variant="primary"
          size="sm"
          iconName="BookOpen"
          iconPosition="left"
          onClick={() => navigate('/assessment/reading')}
          fullWidth
          className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white"
        >
          Reading
        </Button>
        <Button
          variant="primary"
          size="sm"
          iconName="Headphones"
          iconPosition="left"
          onClick={() => navigate('/assessment/listening')}
          fullWidth
          className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
        >
          Listening
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          size="md"
          iconName="History"
          iconPosition="left"
          onClick={() => navigate('/practice-history')}
          fullWidth
          className="sm:flex-1"
        >
          Practice History
        </Button>
        <Button
          variant="outline"
          size="md"
          iconName="Lightbulb"
          iconPosition="left"
          onClick={() => {
            const tipsSection = document.getElementById('confidence-tips');
            if (tipsSection) {
              tipsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          fullWidth
          className="sm:flex-1"
        >
          Confidence Tips
        </Button>
      </div>
    </div>
  );
};

export default QuickAccessButtons;