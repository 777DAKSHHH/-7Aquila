import React from "react";

const SummaryCompletion = ({ question, value = "", onChange }) => {
  const { question_number, question_data } = question;
  const { text, placeholder = "...", word_limit_text = "" } = question_data;

  const handleChange = (e) => {
    onChange(question_number, e.target.value);
  };

  // Find blank placeholders in the text (e.g., "[blank]", "___", or "[input]")
  const placeholderRegex = /\[blank\]|___|\[input\]/gi;
  const parts = text.split(placeholderRegex);

  // If there is no blank placeholder, render a standard prompt + input below it
  if (parts.length === 1) {
    return (
      <div id={`question-${question_number}`} className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold mt-0.5">
            {question_number}
          </span>
          <div className="space-y-1 flex-1">
            <div className="text-sm font-semibold text-foreground leading-relaxed">{text}</div>
            {word_limit_text && (
              <div className="text-xs font-mono text-primary font-semibold uppercase tracking-wider">{word_limit_text}</div>
            )}
          </div>
        </div>
        <div className="pl-9 max-w-xs">
          <input
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    );
  }

  // Render the text with the inline input field placed correctly in the middle
  return (
    <div id={`question-${question_number}`} className="p-4 bg-muted/20 border border-border/60 rounded-xl space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold mt-0.5">
          {question_number}
        </span>
        <div className="space-y-2 flex-1">
          <div className="text-sm font-semibold text-foreground leading-relaxed inline-block">
            {parts[0]}
            <input
              type="text"
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              className="mx-2 px-2 py-0.5 w-32 h-7 rounded border border-input bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary inline-block font-mono"
            />
            {parts[1]}
          </div>
          {word_limit_text && (
            <div className="text-xs font-mono text-primary font-semibold uppercase tracking-wider block">
              {word_limit_text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryCompletion;
