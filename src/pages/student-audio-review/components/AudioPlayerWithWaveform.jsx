import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AudioPlayerWithWaveform = ({ audioUrl, duration, onAddComment }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef?.current;
    if (!canvas) return;

    const ctx = canvas?.getContext('2d');
    const width = canvas?.width;
    const height = canvas?.height;

    ctx?.clearRect(0, 0, width, height);

    const barCount = 100;
    const barWidth = width / barCount;
    const progress = currentTime / duration;

    for (let i = 0; i < barCount; i++) {
      const barHeight = (Math.random() * 0.6 + 0.4) * height * 0.8;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      if (i / barCount <= progress) {
        ctx.fillStyle = 'var(--color-primary)';
      } else {
        ctx.fillStyle = 'var(--color-muted)';
      }

      ctx?.fillRect(x, y, barWidth - 2, barHeight);
    }
  }, [currentTime, duration]);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio?.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio?.addEventListener('timeupdate', updateTime);
    audio?.addEventListener('ended', handleEnded);

    return () => {
      audio?.removeEventListener('timeupdate', updateTime);
      audio?.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef?.current;
    if (isPlaying) {
      audio?.pause();
    } else {
      audio?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = progressBarRef?.current?.getBoundingClientRect();
    const clickX = e?.clientX - rect?.left;
    const percentage = clickX / rect?.width;
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSpeedChange = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = speeds?.indexOf(playbackSpeed);
    const nextSpeed = speeds?.[(currentIndex + 1) % speeds?.length];
    setPlaybackSpeed(nextSpeed);
    audioRef.current.playbackRate = nextSpeed;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e?.target?.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const skipBackward = () => {
    audioRef.current.currentTime = Math.max(0, currentTime - 10);
  };

  const skipForward = () => {
    audioRef.current.currentTime = Math.min(duration, currentTime + 10);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins)?.padStart(2, '0')}:${String(secs)?.padStart(2, '0')}`;
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-sm border border-border">
      <audio ref={audioRef} src={audioUrl} />

      <div className="mb-4 md:mb-6">
        <canvas
          ref={canvasRef}
          width={1000}
          height={120}
          className="w-full h-20 md:h-24 lg:h-28 rounded-md bg-muted/30 cursor-pointer"
          onClick={handleSeek}
        />
      </div>

      <div
        ref={progressBarRef}
        className="relative w-full h-2 bg-muted rounded-full overflow-hidden mb-4 cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-100"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-center md:justify-start">
          <Button variant="ghost" size="icon" onClick={skipBackward}>
            <Icon name="SkipBack" size={20} />
          </Button>

          <Button variant="default" size="icon" onClick={togglePlayPause} className="w-12 h-12">
            <Icon name={isPlaying ? 'Pause' : 'Play'} size={24} />
          </Button>

          <Button variant="ghost" size="icon" onClick={skipForward}>
            <Icon name="SkipForward" size={20} />
          </Button>

          <div className="text-sm font-mono text-foreground whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-center md:justify-end">
          <Button variant="outline" size="sm" onClick={handleSpeedChange}>
            {playbackSpeed}x
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            >
              <Icon name={volume === 0 ? 'VolumeX' : volume < 0.5 ? 'Volume1' : 'Volume2'} size={20} />
            </Button>
            {showVolumeSlider && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-card border border-border rounded-lg p-3 shadow-lg">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 accent-primary"
                />
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" iconName="MessageSquare" onClick={onAddComment}>
            Add Comment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayerWithWaveform;