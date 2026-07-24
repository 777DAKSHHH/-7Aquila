import React from "react";
import AppIcon from "../../../../../components/AppIcon";
import { TASK1_DEFAULTS } from "../constants/task1Constants";

/**
 * QuestionImageContainer Component (Phase 2 - Question Rendering Engine)
 *
 * Responsibilities:
 * - Renders Task 1 graphic chart/diagram asset safely.
 * - Displays skeleton loader while image is loading.
 * - Preserves aspect ratio and prevents cumulative layout shift.
 * - Handles image load errors gracefully with fallback message ("Question image unavailable.").
 * - Provides full-size image preview action.
 */
const QuestionImageContainer = ({
  imageUrl,
  imageLoading,
  imageError,
  onImageLoad,
  onImageError,
  altText = "IELTS Writing Task 1 Diagram",
}) => {
  const showFallback = imageError || (!imageUrl && !imageLoading);

  return (
    <div className="space-y-2 w-full">
      {/* Header bar for image container */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
        <span className="flex items-center gap-1.5">
          <AppIcon name="Image" size={15} className="text-primary" />
          Task Diagram / Visual Chart
        </span>
        {imageUrl && !showFallback && (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 text-xs transition-colors"
          >
            <AppIcon name="ExternalLink" size={13} />
            View Full Size
          </a>
        )}
      </div>

      {/* Main Image Frame (Fixed aspect area to prevent layout shift) */}
      <div className="relative bg-muted/20 border border-border rounded-xl p-3 flex items-center justify-center min-h-[300px] max-h-[460px] w-full overflow-hidden shadow-xs">
        {/* 1. Skeleton Loader while image is downloading */}
        {imageLoading && !showFallback && (
          <div className="absolute inset-0 bg-muted/60 animate-pulse flex flex-col items-center justify-center space-y-3 p-6">
            <AppIcon name="Image" size={40} className="text-muted-foreground/40 animate-bounce" />
            <span className="text-xs text-muted-foreground font-medium">
              Loading diagram asset...
            </span>
          </div>
        )}

        {/* 2. Image Element */}
        {imageUrl && !showFallback && (
          <img
            src={imageUrl}
            alt={altText}
            loading="lazy"
            onLoad={onImageLoad}
            onError={onImageError}
            className={`max-h-[420px] w-auto max-w-full object-contain rounded-lg transition-opacity duration-300 ${
              imageLoading ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {/* 3. Graceful Fallback Banner if image fails to load or path is missing */}
        {showFallback && (
          <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3 max-w-sm">
            <div className="p-3 bg-muted/50 rounded-full text-muted-foreground/70">
              <AppIcon name="ImageOff" size={36} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">
                {TASK1_DEFAULTS.IMAGE_FALLBACK_TEXT}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The diagram for this question could not be loaded. Refer to the written prompt instructions to complete your report.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(QuestionImageContainer);
