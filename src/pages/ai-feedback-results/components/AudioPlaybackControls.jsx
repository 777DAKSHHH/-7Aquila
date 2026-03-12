import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AudioPlaybackControls = ({ 
  audioUrl = '',
  duration = 0,
  onTimeUpdate = () => {}
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio?.currentTime);
      onTimeUpdate(audio?.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio?.addEventListener('timeupdate', handleTimeUpdate);
    audio?.addEventListener('ended', handleEnded);

    return () => {
      audio?.removeEventListener('timeupdate', handleTimeUpdate);
      audio?.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  const togglePlayPause = () => {
    const audio = audioRef?.current;
    if (!audio) return;

    if (isPlaying) {
      audio?.pause();
    } else {
      audio?.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef?.current;
    if (!audio) return;

    const seekTime = (e?.target?.value / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef?.current;
    const newVolume = e?.target?.value / 100;
    setVolume(newVolume);
    if (audio) audio.volume = newVolume;
  };

  const handlePlaybackRateChange = (rate) => {
    const audio = audioRef?.current;
    setPlaybackRate(rate);
    if (audio) audio.playbackRate = rate;
  };

  const skipTime = (seconds) => {
    const audio = audioRef?.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, audio?.currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins)?.padStart(2, '0')}:${String(secs)?.padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 shadow-md border border-border">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base md:text-lg font-heading font-semibold text-foreground">
          Audio Playback
        </h4>
        <div className="flex items-center gap-2">
          <Icon name="Headphones" size={20} color="var(--color-primary)" />
          <span className="text-sm text-muted-foreground font-caption">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
      <div className="mb-4">
        <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden cursor-pointer">
          <div 
            className="absolute top-0 left-0 h-full bg-primary transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={progressPercentage}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="SkipBack"
            onClick={() => skipTime(-10)}
          />
          <Button
            variant="default"
            size="lg"
            iconName={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlayPause}
          />
          <Button
            variant="outline"
            size="sm"
            iconName="SkipForward"
            onClick={() => skipTime(10)}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Icon name="Volume2" size={18} color="var(--color-muted-foreground)" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-muted rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${volume * 100}%, var(--color-muted) ${volume * 100}%, var(--color-muted) 100%)`
              }}
            />
          </div>

          <div className="flex items-center gap-1">
            {[0.75, 1, 1.25, 1.5]?.map((rate) => (
              <button
                key={rate}
                onClick={() => handlePlaybackRateChange(rate)}
                className={`px-2 py-1 text-xs font-medium rounded transition-all duration-base ${
                  playbackRate === rate
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="Info" size={16} />
          <span className="font-caption">
            Use playback controls to review specific sections of your recording
          </span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlaybackControls;