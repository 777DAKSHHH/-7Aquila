import React, { useState, useRef, useEffect } from "react";
import AppIcon from "components/AppIcon";

const StickyNote = ({
  id,
  selectedText = "",
  initialText = "",
  initialPosition = { x: 100, y: 150 },
  onChange,
  onDelete
}) => {
  const [text, setText] = useState(initialText);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  
  const cardRef = useRef(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    // Only drag from the title bar
    if (e.target.closest(".drag-handle")) {
      e.preventDefault();
      isDragging.current = true;
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    
    // Bounds check to keep notes in viewport limits
    const boundedX = Math.max(10, Math.min(window.innerWidth - 200, newX));
    const boundedY = Math.max(80, Math.min(window.innerHeight - 200, newY));
    
    setPosition({ x: boundedX, y: boundedY });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleTextChange = (e) => {
    setText(e.target.value);
    onChange(id, e.target.value);
  };

  if (isMinimized) {
    return (
      <div
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
        className="fixed z-40 bg-amber-400 hover:bg-amber-300 border border-amber-500 shadow-lg w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition transform hover:scale-105"
        onClick={() => setIsMinimized(false)}
        title={`Expand sticky note: "${text.substring(0, 15)}..."`}
      >
        <AppIcon name="MessageSquare" size={18} className="text-amber-950 animate-pulse" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border border-card"></span>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-40 bg-amber-100 dark:bg-amber-900/90 border border-amber-400 dark:border-amber-700 shadow-2xl rounded-xl w-64 overflow-hidden flex flex-col animate-in zoom-in-95 duration-100"
    >
      {/* Title Bar drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="drag-handle bg-amber-300 dark:bg-amber-800 p-2.5 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-100 font-semibold text-xs">
          <AppIcon name="MessageSquare" size={14} />
          <span>Sticky Note</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-0.5 rounded hover:bg-amber-400/50 text-amber-950 dark:text-amber-100"
            title="Minimize Note"
          >
            <AppIcon name="Minus" size={14} />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-0.5 rounded hover:bg-amber-400/50 text-amber-950 dark:text-amber-100 hover:text-destructive"
            title="Delete Note"
          >
            <AppIcon name="X" size={14} />
          </button>
        </div>
      </div>

      {/* Selected Text context snippet */}
      {selectedText && (
        <div className="bg-amber-200/50 dark:bg-amber-950/30 px-3 py-1.5 border-b border-amber-300/40 text-[10px] text-amber-900/80 dark:text-amber-200/80 font-medium italic line-clamp-2 select-none">
          Ref: "{selectedText}"
        </div>
      )}

      {/* Note Area */}
      <div className="p-2 flex-1">
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Type your notes here..."
          className="w-full h-24 bg-transparent border-0 resize-none outline-none focus:ring-0 text-xs font-sans text-amber-950 dark:text-amber-100 leading-normal placeholder-amber-950/40 dark:placeholder-amber-100/40"
        />
      </div>
    </div>
  );
};

export default StickyNote;
