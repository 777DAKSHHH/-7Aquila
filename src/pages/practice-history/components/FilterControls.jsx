import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterControls = ({
  dateRange = 'all',
  topicType = 'all',
  scoreRange = 'all',
  searchQuery = '',
  onDateRangeChange = () => {},
  onTopicTypeChange = () => {},
  onScoreRangeChange = () => {},
  onSearchChange = () => {},
  onReset = () => {}
}) => {
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: '3months', label: 'Last 3 Months' },
    { value: '6months', label: 'Last 6 Months' }
  ];

  const topicTypeOptions = [
    { value: 'all', label: 'All Topics' },
    { value: 'education', label: 'Education' },
    { value: 'technology', label: 'Technology' },
    { value: 'environment', label: 'Environment' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'travel', label: 'Travel & Tourism' },
    { value: 'work', label: 'Work & Career' }
  ];

  const scoreRangeOptions = [
    { value: 'all', label: 'All Scores' },
    { value: '7-9', label: '7.0 - 9.0' },
    { value: '5-7', label: '5.0 - 6.9' },
    { value: '0-5', label: 'Below 5.0' }
  ];

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
          Filter & Search
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          iconName="RotateCcw" 
          iconPosition="left"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          type="search"
          placeholder="Search by topic..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e?.target?.value)}
          className="w-full"
        />

        <Select
          options={dateRangeOptions}
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder="Select date range"
        />

        <Select
          options={topicTypeOptions}
          value={topicType}
          onChange={onTopicTypeChange}
          placeholder="Select topic type"
        />

        <Select
          options={scoreRangeOptions}
          value={scoreRange}
          onChange={onScoreRangeChange}
          placeholder="Select score range"
        />
      </div>
    </div>
  );
};

export default FilterControls;