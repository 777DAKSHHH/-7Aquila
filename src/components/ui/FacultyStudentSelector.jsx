import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import Input from './Input';

const FacultyStudentSelector = ({
  students = [],
  selectedStudentId = null,
  onStudentSelect = () => {},
  showSearch = true,
  showStats = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState(students);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const filtered = students?.filter(
      (student) =>
        student?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        student?.email?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        student?.studentId?.toLowerCase()?.includes(searchQuery?.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedStudent = students?.find((s) => s?.id === selectedStudentId);

  const handleStudentClick = (student) => {
    onStudentSelect(student?.id);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-all duration-base focus-ring"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="User" size={20} color="var(--color-primary)" />
          </div>
          <div className="text-left">
            <p className="font-medium text-foreground">
              {selectedStudent ? selectedStudent?.name : 'Select a student'}
            </p>
            {selectedStudent && (
              <p className="text-sm text-muted-foreground font-caption">
                {selectedStudent?.studentId} • {selectedStudent?.email}
              </p>
            )}
          </div>
        </div>
        <Icon
          name={isOpen ? 'ChevronUp' : 'ChevronDown'}
          size={20}
          color="var(--color-muted-foreground)"
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-[50] max-h-[400px] overflow-hidden flex flex-col animate-scale-in">
          {showSearch && (
            <div className="p-3 border-b border-border">
              <Input
                type="search"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e?.target?.value)}
              />
            </div>
          )}

          <div className="overflow-y-auto">
            {filteredStudents?.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Icon name="Search" size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-caption">No students found</p>
              </div>
            ) : (
              filteredStudents?.map((student) => {
                const isSelected = student?.id === selectedStudentId;
                return (
                  <button
                    key={student?.id}
                    onClick={() => handleStudentClick(student)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-muted transition-all duration-base ${
                      isSelected ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={20} color="var(--color-primary)" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{student?.name}</p>
                        {isSelected && (
                          <Icon name="Check" size={16} color="var(--color-success)" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-caption">
                        {student?.studentId}
                      </p>
                      <p className="text-xs text-muted-foreground font-caption">
                        {student?.email}
                      </p>
                      {showStats && student?.stats && (
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground font-caption">
                            Tests: {student?.stats?.totalTests}
                          </span>
                          <span className="text-xs text-muted-foreground font-caption">
                            Avg: {student?.stats?.averageScore}
                          </span>
                          <span className="text-xs text-muted-foreground font-caption">
                            Last: {student?.stats?.lastTestDate}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default 
FacultyStudentSelector;