import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const StudentInfoHeader = ({ student, testDetails, aiScores }) => {
  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-sm border border-border">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
            <Image
              src={student?.avatar}
              alt={student?.avatarAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-heading font-semibold text-foreground">
              {student?.name}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground font-caption">
              {student?.studentId} • {student?.email}
            </p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Calendar" size={16} color="var(--color-primary)" />
              <span className="text-xs font-caption text-muted-foreground">Test Date</span>
            </div>
            <p className="text-sm md:text-base font-medium text-foreground">{testDetails?.date}</p>
          </div>

          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="MessageSquare" size={16} color="var(--color-primary)" />
              <span className="text-xs font-caption text-muted-foreground">Topic</span>
            </div>
            <p className="text-sm md:text-base font-medium text-foreground line-clamp-1">
              {testDetails?.topic}
            </p>
          </div>

          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Clock" size={16} color="var(--color-primary)" />
              <span className="text-xs font-caption text-muted-foreground">Duration</span>
            </div>
            <p className="text-sm md:text-base font-medium text-foreground">{testDetails?.duration}</p>
          </div>

          <div className="bg-primary/10 rounded-md p-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Award" size={16} color="var(--color-primary)" />
              <span className="text-xs font-caption text-muted-foreground">AI Score</span>
            </div>
            <p className="text-xl md:text-2xl font-heading font-bold text-primary">
              {aiScores?.overall}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-xs font-caption text-muted-foreground mb-1">Fluency</p>
            <p className="text-base md:text-lg font-semibold text-foreground">{aiScores?.fluency}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-caption text-muted-foreground mb-1">Lexical</p>
            <p className="text-base md:text-lg font-semibold text-foreground">{aiScores?.lexical}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-caption text-muted-foreground mb-1">Grammar</p>
            <p className="text-base md:text-lg font-semibold text-foreground">{aiScores?.grammar}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-caption text-muted-foreground mb-1">Pronunciation</p>
            <p className="text-base md:text-lg font-semibold text-foreground">
              {aiScores?.pronunciation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInfoHeader;