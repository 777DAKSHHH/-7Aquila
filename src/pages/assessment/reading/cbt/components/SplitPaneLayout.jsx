import React, { useState, useEffect, useRef } from "react";

const SplitPaneLayout = ({ leftPane, rightPane, defaultSplit = 50, minSplit = 20, maxSplit = 80 }) => {
  const [splitPercentage, setSplitPercentage] = useState(defaultSplit);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = e.clientX - containerRect.left;
    const newPercentage = (newLeftWidth / containerRect.width) * 100;
    
    if (newPercentage >= minSplit && newPercentage <= maxSplit) {
      setSplitPercentage(newPercentage);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  const handleTouchStart = (e) => {
    isDragging.current = true;
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current || !containerRef.current || e.touches.length === 0) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const newLeftWidth = touch.clientX - containerRect.left;
    const newPercentage = (newLeftWidth / containerRect.width) * 100;
    
    if (newPercentage >= minSplit && newPercentage <= maxSplit) {
      setSplitPercentage(newPercentage);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
  };

  useEffect(() => {
    return () => {
      // Clean up event listeners in case component unmounts while dragging
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex w-full h-[calc(100vh-180px)] border border-border rounded-xl overflow-hidden bg-card"
    >
      {/* Left Pane (Passage) */}
      <div
        style={{ width: `${splitPercentage}%` }}
        className="h-full overflow-y-auto pr-2 relative"
      >
        {leftPane}
      </div>

      {/* Draggable Split Divider */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="w-1.5 hover:w-2 bg-muted hover:bg-primary/50 transition-all duration-base cursor-col-resize flex-shrink-0 flex items-center justify-center relative group"
        title="Drag to resize split view"
      >
        {/* Decorative central grip line */}
        <div className="w-[2px] h-8 bg-muted-foreground/30 group-hover:bg-primary rounded"></div>
      </div>

      {/* Right Pane (Questions) */}
      <div
        style={{ width: `${100 - splitPercentage}%` }}
        className="h-full overflow-y-auto pl-2 relative"
      >
        {rightPane}
      </div>
    </div>
  );
};

export default SplitPaneLayout;
