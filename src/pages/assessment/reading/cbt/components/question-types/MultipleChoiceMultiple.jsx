import React from "react";

const MultipleChoiceMultiple = ({ question, value = [], onChange }) => {
  const { question_number, question_data } = question;
  const { text, options = [] } = question_data;

  // Make sure value is always an array
  const currentAnswers = Array.isArray(value) ? value : value ? [value] : [];

  const parsedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      const match = opt.match(/^([A-Z])[\.\s]+(.*)/i);
      if (match) {
        return { value: match[1].toUpperCase(), label: opt };
      }
      return { value: opt, label: opt };
    }
    return { value: opt.value, label: opt.label || opt.value };
  });

  const handleToggle = (optionValue) => {
    let updatedAnswers;
    if (currentAnswers.includes(optionValue)) {
      updatedAnswers = currentAnswers.filter((val) => val !== optionValue);
    } else {
      updatedAnswers = [...currentAnswers, optionValue];
    }
    onChange(question_number, updatedAnswers);
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

      <div className="pl-9 space-y-2">
        {parsedOptions.map((opt, idx) => {
          const isChecked = currentAnswers.includes(opt.value);
          return (
            <label
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-base text-sm ${
                isChecked
                  ? "bg-primary/5 border-primary font-medium"
                  : "bg-card border-border/80 hover:bg-muted/40"
              }`}
            >
              <input
                type="checkbox"
                name={`mcq-multiple-${question_number}`}
                value={opt.value}
                checked={isChecked}
                onChange={() => handleToggle(opt.value)}
                className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-foreground leading-tight">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default MultipleChoiceMultiple;
