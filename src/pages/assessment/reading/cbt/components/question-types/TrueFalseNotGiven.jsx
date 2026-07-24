import React from "react";

const TrueFalseNotGiven = ({ question, value, onChange }) => {
  const { question_number, question_type, question_data } = question;
  const { text } = question_data;

  const isYnng = question_type === "ynng";
  const options = isYnng
    ? [
        { label: "YES", value: "YES" },
        { label: "NO", value: "NO" },
        { label: "NOT GIVEN", value: "NOT GIVEN" }
      ]
    : [
        { label: "TRUE", value: "TRUE" },
        { label: "FALSE", value: "FALSE" },
        { label: "NOT GIVEN", value: "NOT GIVEN" }
      ];

  const handleSelect = (optValue) => {
    onChange(question_number, optValue);
  };

  return (
    <div id={`question-${question_number}`} className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold mt-0.5">
          {question_number}
        </span>
        <div className="text-sm font-semibold text-foreground leading-relaxed">
          {text}
        </div>
      </div>

      <div className="pl-9 flex flex-col sm:flex-row gap-3">
        {options.map((opt, idx) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={idx}
              className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm font-medium transition-all duration-base text-center ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border/80 hover:bg-muted/40 text-foreground"
              }`}
            >
              <input
                type="radio"
                name={`tfng-${question_number}`}
                value={opt.value}
                checked={isSelected}
                onChange={() => handleSelect(opt.value)}
                className="sr-only" // Screen reader only, hidden visually since the label styles act as buttons
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default TrueFalseNotGiven;
