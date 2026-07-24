import React from "react";

// Inline MCQ Single Component
const MultipleChoiceSingle = ({ question, value, onChange }) => {
  const { question_number, question_data } = question;
  const { text, options = [] } = question_data;

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
                onChange={() => onChange(question_number, opt.value)}
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

// Inline MCQ Multiple Component (Select all that apply / checkboxes)
const MultipleChoiceMultiple = ({ question, value = [], onChange }) => {
  const { question_number, question_data } = question;
  const { text, options = [] } = question_data;

  // Make sure value is array
  const activeValues = Array.isArray(value) ? value : (value ? [value] : []);

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

  const handleCheckboxChange = (optionValue) => {
    let nextValues;
    if (activeValues.includes(optionValue)) {
      nextValues = activeValues.filter(val => val !== optionValue);
    } else {
      nextValues = [...activeValues, optionValue];
    }
    onChange(question_number, nextValues);
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
          const isSelected = activeValues.includes(opt.value);
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
                type="checkbox"
                name={`mcq-multiple-${question_number}`}
                value={opt.value}
                checked={isSelected}
                onChange={() => handleCheckboxChange(opt.value)}
                className="mt-0.5 text-primary rounded focus:ring-primary h-4 w-4"
              />
              <span className="text-foreground leading-tight">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

// Inline Sentence Completion / Fill in Blanks Component
const SentenceCompletion = ({ question, value = "", onChange }) => {
  const { question_number, question_data } = question;
  const { text, placeholder = "type answer...", word_limit_text = "" } = question_data;

  const placeholderRegex = /\[blank\]|___|\[input\]/gi;
  const parts = text.split(placeholderRegex);

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
            onChange={(e) => onChange(question_number, e.target.value)}
            placeholder={placeholder}
            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
      </div>
    );
  }

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
              onChange={(e) => onChange(question_number, e.target.value)}
              placeholder={placeholder}
              className="mx-2 px-2 py-0.5 w-36 h-8 rounded border border-input bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary inline-block font-mono"
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

const ListeningQuestionPane = ({ questions = [], userAnswers = {}, onAnswerChange }) => {
  const renderQuestion = (q) => {
    const qValue = userAnswers[String(q.question_number)];

    switch (q.question_type) {
      case "mcq_single":
        return (
          <MultipleChoiceSingle
            key={q.id}
            question={q}
            value={qValue}
            onChange={onAnswerChange}
          />
        );
      case "mcq_multiple":
        return (
          <MultipleChoiceMultiple
            key={q.id}
            question={q}
            value={qValue}
            onChange={onAnswerChange}
          />
        );
      case "sentence_completion":
      case "summary_completion":
      case "table_completion":
      case "short_answer":
      default:
        return (
          <SentenceCompletion
            key={q.id}
            question={q}
            value={qValue}
            onChange={onAnswerChange}
          />
        );
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
        No questions loaded for this section.
      </div>
    );
  }

  // Group questions by instruction text for IELTS layout consistency
  const groupedQuestions = [];
  let currentGroup = null;

  for (const q of questions) {
    if (!currentGroup || currentGroup.instruction !== q.instruction_text) {
      if (currentGroup) groupedQuestions.push(currentGroup);
      currentGroup = {
        instruction: q.instruction_text,
        questions: [q]
      };
    } else {
      currentGroup.questions.push(q);
    }
  }
  if (currentGroup) groupedQuestions.push(currentGroup);

  return (
    <div className="space-y-8 select-text">
      {groupedQuestions.map((group, groupIdx) => (
        <section key={groupIdx} className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/90 font-medium leading-relaxed shadow-sm">
            {group.instruction}
          </div>

          <div className="space-y-4">
            {group.questions.map((q) => renderQuestion(q))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ListeningQuestionPane;
