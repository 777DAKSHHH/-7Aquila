import React from "react";
import MultipleChoiceSingle from "./question-types/MultipleChoiceSingle";
import MultipleChoiceMultiple from "./question-types/MultipleChoiceMultiple";
import TrueFalseNotGiven from "./question-types/TrueFalseNotGiven";
import ShortAnswer from "./question-types/ShortAnswer";
import MatchingHeadings from "./question-types/MatchingHeadings";
import SummaryCompletion from "./question-types/SummaryCompletion";

const QuestionPane = ({ questions = [], userAnswers = {}, onAnswerChange }) => {
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
      case "tfng":
      case "ynng":
        return (
          <TrueFalseNotGiven
            key={q.id}
            question={q}
            value={qValue}
            onChange={onAnswerChange}
          />
        );
      case "short_answer":
        return (
          <ShortAnswer
            key={q.id}
            question={q}
            value={qValue}
            onChange={onAnswerChange}
          />
        );
      case "matching_headings":
        return (
          <MatchingHeadings
            key={q.id}
            question={q}
            value={qValue}
            onChange={onAnswerChange}
          />
        );
      case "summary_completion":
      case "sentence_completion":
        return (
          <SummaryCompletion
            key={q.id}
            question={q}
            value={qValue}
            onChange={onAnswerChange}
          />
        );
      default:
        // Fallback for missing/unimplemented question types (e.g. diagram labeling or table completion)
        return (
          <ShortAnswer
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
      <div className="p-8 text-center text-muted-foreground">
        No questions loaded for this section.
      </div>
    );
  }

  // Group questions by instruction text if appropriate, to match IELTS layout where 
  // multiple questions share the same instruction block (e.g. Questions 1-5, Questions 6-10)
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
    <div className="p-6 md:p-8 space-y-8 select-text">
      <header className="border-b border-border pb-4">
        <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
          Questions
        </h2>
      </header>

      <div className="space-y-10">
        {groupedQuestions.map((group, groupIdx) => (
          <section key={groupIdx} className="space-y-6">
            {/* Instruction block matching standard IELTS CBT formatting */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/90 font-medium leading-relaxed">
              {group.instruction}
            </div>

            <div className="space-y-4">
              {group.questions.map((q) => renderQuestion(q))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default QuestionPane;
