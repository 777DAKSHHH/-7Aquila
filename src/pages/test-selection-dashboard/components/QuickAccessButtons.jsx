import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const QuickAccessButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
      <Button
        variant="outline"
        size="lg"
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
        size="lg"
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
  );
};

export default QuickAccessButtons;