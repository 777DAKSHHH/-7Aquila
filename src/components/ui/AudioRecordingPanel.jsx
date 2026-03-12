import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const AudioRecordingPanel = ({
  isRecording = false,
  isPaused = false,
  recordingTime = 0,
  maxDuration = 120,
  onStartRecording = () => {},
  onStopRecording = () => {},
  onPauseRecording = () => {},
  onResumeRecording = () => {},
  audioLevel = 0,
  error = null,
}) => {
  const [displayTime, setDisplayTime] = useState('00:00');
  const canvasRef = useRef(null);

  useEffect(() => {
    const minutes = Math.floor(recordingTime / 60);
    const seconds = recordingTime % 60;
    setDisplayTime(`${String(minutes)?.padStart(2, '0')}:${String(seconds)?.padStart(2, '0')}`);
  }, [recordingTime]);

  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;

    const ctx = canvas?.getContext('2d');
    const width = canvas?.width;
    const height = canvas?.height;

    ctx?.clearRect(0, 0, width, height);

    if (isRecording && !isPaused) {
      const barCount = 40;
      const barWidth = width / barCount;
      const normalizedLevel = Math.min(audioLevel / 100, 1);

      for (let i = 0; i < barCount; i++) {
        const barHeight = (Math.random() * 0.5 + 0.5) * normalizedLevel * height * 0.8;
        const x = i * barWidth;
        const y = (height - barHeight) / 2;

        ctx.fillStyle = 'var(--color-primary)';
        ctx?.fillRect(x, y, barWidth - 2, barHeight);
      }
    } else {
      ctx.fillStyle = 'var(--color-muted)';
      const centerY = height / 2;
      ctx?.fillRect(0, centerY - 1, width, 2);
    }
  }, [isRecording, isPaused, audioLevel]);

  const progressPercentage = (recordingTime / maxDuration) * 100;
  const isNearLimit = recordingTime >= maxDuration * 0.9;

  return (
    <div className="bg-card rounded-lg p-6 shadow-md border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full transition-all duration-base ${
              isRecording && !isPaused
                ? 'bg-error animate-pulse'
                : isPaused
                ? 'bg-warning' :'bg-muted'
            }`}
          />
          <h3 className="text-lg font-heading font-semibold text-foreground">
            {isRecording ? (isPaused ? 'Recording Paused' : 'Recording...') : 'Ready to Record'}
          </h3>
        </div>
        <div
          className={`text-2xl font-mono font-semibold ${
            isNearLimit ? 'text-error' : 'text-foreground'
          }`}
        >
          {displayTime}
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-md flex items-start gap-2">
          <Icon name="AlertCircle" size={18} color="var(--color-error)" />
          <p className="text-sm text-error flex-1">{error}</p>
        </div>
      )}
      <div className="relative mb-6">
        <canvas
          ref={canvasRef}
          width={600}
          height={80}
          className="w-full h-20 rounded-md bg-muted/30"
        />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isNearLimit ? 'bg-error' : 'bg-primary'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-center gap-3">
        {!isRecording ? (
          <Button
            variant="default"
            size="lg"
            iconName="Mic"
            iconPosition="left"
            onClick={onStartRecording}
            className="min-w-[160px]"
          >
            Start Recording
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                variant="default"
                size="lg"
                iconName="Play"
                iconPosition="left"
                onClick={onResumeRecording}
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                iconName="Pause"
                iconPosition="left"
                onClick={onPauseRecording}
              >
                Pause
              </Button>
            )}
            <Button
              variant="destructive"
              size="lg"
              iconName="Square"
              iconPosition="left"
              onClick={onStopRecording}
            >
              Stop
            </Button>
          </>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="Info" size={16} />
            <span className="font-caption">
              Maximum duration: {Math.floor(maxDuration / 60)}:{String(maxDuration % 60)?.padStart(2, '0')}
            </span>
          </div>
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-success font-caption font-medium">Active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecordingPanel;