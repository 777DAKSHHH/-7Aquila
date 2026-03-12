import React from 'react';
import Button from '../../../components/ui/Button';

const BulkActionsBar = ({ selectedCount = 0, onDownloadReports, onExportData, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold mono text-primary">{selectedCount}</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {selectedCount} student{selectedCount > 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={onDownloadReports}
          >
            Download Reports
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="FileSpreadsheet"
            iconPosition="left"
            onClick={onExportData}
          >
            Export Data
          </Button>
          <Button variant="ghost" size="sm" iconName="X" onClick={onClearSelection}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;