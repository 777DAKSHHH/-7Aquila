import React from "react";
import Input from "components/ui/Input";

const ShortAnswer = ({ question, value = "", onChange }) => {
  const { question_number, question_data } = question;
  const { text, placeholder = "Type your answer here...", word_limit_text = "" } = question_data;

  const handleChange = (e) => {
    onChange(question_number, e.target.value);
  };

  return (
    <div id={`question-${question_number}`} className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold mt-0.5">
          {question_number}
        </span>
        <div className="space-y-1 flex-1">
          <div className="text-sm font-semibold text-foreground leading-relaxed">
            {text}
          </div>
          {word_limit_text && (
            <div className="text-xs font-mono text-primary font-semibold uppercase tracking-wider">
              {word_limit_text}
            </div>
          )}
        </div>
      </div>

      <div className="pl-9 max-w-md">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ShortAnswer;
