import React from "react";

const MultipleChoiceSingle = ({ question, value, onChange }) => {
  const { question_number, question_data } = question;
  const { text, options = [] } = question_data;

  // Normalizes options. Some might be strings or objects.
  const parsedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      // e.g. "A. option text" -> optionValue: "A", textContent: "option text"
      const match = opt.match(/^([A-Z])[\.\s]+(.*)/i);
      if (match) {
        return { value: match[1].toUpperCase(), label: opt };
      }
      return { value: opt, label: opt };
    }
    return { value: opt.value, label: opt.label || opt.value };
  });

  const handleSelect = (optionValue) => {
    onChange(question_number, optionValue);
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
          const isSelected = value === opt.value;
          return (
            <label
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-base text-sm ${
                isSelected
                  ? "bg-primary/5 border-primary font-medium"
                  : "bg-card border-border/80 hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name={`mcq-single-${question_number}`}
                value={opt.value}
                checked={isSelected}
                onChange={() => handleSelect(opt.value)}
                className="mt-0.5 text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-foreground leading-tight">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default MultipleChoiceSingle;
