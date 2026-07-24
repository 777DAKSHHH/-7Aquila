import React from "react";
import AppIcon from "components/AppIcon";

const HighlighterMenu = ({ position, visible, onHighlight, onAddNote, onClear }) => {
  if (!visible || !position) return null;

  return (
    <div
      style={{
        top: `${position.y - 50}px`, // Place slightly above the selection coordinate
        left: `${position.x}px`,
        transform: "translateX(-50%)",
      }}
      className="fixed z-50 flex items-center gap-1.5 bg-card/95 backdrop-blur-sm border border-border shadow-2xl rounded-xl p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none"
    >
      {/* Yellow Highlight Button */}
      <button
        onClick={() => onHighlight("#fef08a")} // Tailwind bg-yellow-200
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 text-yellow-800 transition duration-base"
        title="Highlight Yellow"
      >
        <span className="w-4 h-4 rounded-full bg-yellow-400 border border-yellow-500"></span>
      </button>

      {/* Green Highlight Button */}
      <button
        onClick={() => onHighlight("#bbf7d0")} // Tailwind bg-green-200
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-800 transition duration-base"
        title="Highlight Green"
      >
        <span className="w-4 h-4 rounded-full bg-green-400 border border-green-500"></span>
      </button>

      <div className="w-[1px] h-6 bg-border mx-0.5"></div>

      {/* Sticky Note Button */}
      <button
        onClick={onAddNote}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-primary transition duration-base"
        title="Add Note"
      >
        <AppIcon name="MessageSquare" size={16} />
      </button>

      {/* Clear Styling Button */}
      <button
        onClick={onClear}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-destructive transition duration-base"
        title="Clear Selection Format"
      >
        <AppIcon name="Eraser" size={16} />
      </button>
    </div>
  );
};

export default HighlighterMenu;
