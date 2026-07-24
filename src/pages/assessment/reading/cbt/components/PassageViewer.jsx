import React, { useRef } from "react";

const PassageViewer = ({
  title,
  subTitle,
  contentHtml,
  textSize = "medium",
  onTextSelect
}) => {
  const containerRef = useRef(null);

  const handleSelectionCheck = (e) => {
    if (!onTextSelect) return;

    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) {
      // Check if user clicked on an existing highlight to allow clearing it
      if (e.target && e.target.classList.contains("cbt-highlight")) {
        const rect = e.target.getBoundingClientRect();
        onTextSelect({
          text: e.target.innerText,
          node: e.target,
          position: {
            x: rect.left + rect.width / 2,
            y: rect.top + window.scrollY
          }
        });
      } else {
        onTextSelect(null); // Clear menu
      }
      return;
    }

    // Ensure the selection is inside our passage container
    const range = selection.getRangeAt(0);
    if (containerRef.current && containerRef.current.contains(range.commonAncestorContainer)) {
      const rect = range.getBoundingClientRect();
      onTextSelect({
        text: selectedText,
        range,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY
        }
      });
    } else {
      onTextSelect(null);
    }
  };

  const getTextSizeClass = () => {
    switch (textSize) {
      case "small":
        return "text-sm leading-relaxed";
      case "large":
        return "text-lg leading-relaxed md:text-xl";
      case "medium":
      default:
        return "text-base leading-relaxed";
    }
  };

  return (
    <article className="p-6 md:p-8 space-y-6 select-text">
      {/* Passage Title Block */}
      <header className="border-b border-border pb-4 space-y-2 select-none">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
          {title || "Reading Passage"}
        </h1>
        {subTitle && (
          <h2 className="text-md md:text-lg text-muted-foreground italic font-medium">
            {subTitle}
          </h2>
        )}
      </header>

      {/* Passage HTML Content Render */}
      <div
        ref={containerRef}
        onMouseUp={handleSelectionCheck}
        onTouchEnd={handleSelectionCheck}
        className={`prose dark:prose-invert max-w-none text-foreground font-sans ${getTextSizeClass()}`}
        style={{
          overflowWrap: "break-word",
          wordBreak: "break-word"
        }}
        dangerouslySetInnerHTML={{ __html: contentHtml || "<p className='text-muted-foreground'>No passage content loaded.</p>" }}
      />
    </article>
  );
};

export default PassageViewer;
