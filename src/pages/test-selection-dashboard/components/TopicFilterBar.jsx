import React from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const TopicFilterBar = ({ searchQuery, onSearchChange, selectedDifficulty, onDifficultyChange, selectedCategory, onCategoryChange }) => {
  const difficultyOptions = [
    { value: 'all', label: 'All Difficulties' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'Personal Life', label: 'Personal Life' },
    { value: 'Education', label: 'Education' },
    { value: 'Work & Career', label: 'Work & Career' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Society & Culture', label: 'Society & Culture' },
    { value: 'Travel, Media & Leisure', label: 'Travel, Media & Leisure' },
  ];

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 shadow-sm border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Filter" size={20} color="var(--color-primary)" />
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Filter Tests
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <Input
            type="search"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e?.target?.value)}
          />
        </div>

        <div className="md:col-span-1">
          <Select
            options={difficultyOptions}
            value={selectedDifficulty}
            onChange={onDifficultyChange}
            placeholder="Select difficulty"
          />
        </div>

        <div className="md:col-span-1">
          <Select
            options={categoryOptions}
            value={selectedCategory}
            onChange={onCategoryChange}
            placeholder="Select category"
          />
        </div>
      </div>
    </div>
  );
};

export default TopicFilterBar;