import React from "react";
import Select from "components/ui/Select";

const MatchingHeadings = ({ question, value = "", onChange }) => {
  const { question_number, question_data } = question;
  const { paragraph_label, headings = [] } = question_data;

  // Build the options in the format Select component expects
  const selectOptions = [
    { label: "Choose Heading...", value: "" },
    ...headings.map((h) => {
      if (typeof h === "string") {
        return { label: h, value: h };
      }
      return { label: h.label || h.value, value: h.value };
    })
  ];

  const handleSelect = (val) => {
    onChange(question_number, val);
  };

  return (
    <div id={`question-${question_number}`} className="p-4 bg-muted/20 border border-border/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-mono text-xs font-bold">
          {question_number}
        </span>
        <div className="text-sm font-semibold text-foreground">
          {paragraph_label}
        </div>
      </div>

      <div className="pl-9 sm:pl-0 w-full sm:max-w-md">
        <Select
          options={selectOptions}
          value={value}
          onChange={handleSelect}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default MatchingHeadings;
