import React from 'react';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const FilterControls = ({
  searchQuery,
  onSearchChange,
  scoreFilter,
  onScoreFilterChange,
  dateFilter,
  onDateFilterChange,
  progressFilter,
  onProgressFilterChange,
  onResetFilters,
}) => {
  const scoreOptions = [
    { value: 'all', label: 'All Scores' },
    { value: '7-9', label: '7.0 - 9.0 (High)' },
    { value: '6-7', label: '6.0 - 6.9 (Medium)' },
    { value: '0-6', label: 'Below 6.0 (Low)' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
  ];

  const progressOptions = [
    { value: 'all', label: 'All Progress' },
    { value: 'high', label: 'High (75%+)' },
    { value: 'medium', label: 'Medium (50-74%)' },
    { value: 'low', label: 'Low (Below 50%)' },
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">Filter Students</h3>
        <Button variant="ghost" size="sm" iconName="RotateCcw" onClick={onResetFilters}>
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          type="search"
          placeholder="Search by name, email, or ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e?.target?.value)}
        />

        <Select
          placeholder="Filter by score"
          options={scoreOptions}
          value={scoreFilter}
          onChange={onScoreFilterChange}
        />

        <Select
          placeholder="Filter by date"
          options={dateOptions}
          value={dateFilter}
          onChange={onDateFilterChange}
        />

        <Select
          placeholder="Filter by progress"
          options={progressOptions}
          value={progressFilter}
          onChange={onProgressFilterChange}
        />
      </div>
    </div>
  );
};

export default FilterControls;