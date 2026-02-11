'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX,
  SkipForward, Headphones,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TTSPlayerProps {
  /** The transcript text to be spoken */
  text: string;
  /** Label shown above the player */
  label?: string;
  /** Callback when speech finishes */
  onEnded?: () => void;
  className?: string;
}

/**
 * Text-to-Speech Audio Player
 * Uses the Web Speech API (SpeechSynthesis) to read listening transcripts aloud.
 * Falls back gracefully when the API is unavailable.
 */
export function TTSPlayer({
  text,
  label = 'Listening Audio',
  onEnded,
  className,
}: TTSPlayerProps) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const estimatedDuration = useRef(0);

  // Check support & load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const v = speechSynthesis.getVoices();
      setVoices(v);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      speechSynthesis.cancel();
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  // Pick best English voice
  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;
    // Prefer high-quality English voices
    const preferred = [
      'Google UK English Female',
      'Google UK English Male',
      'Microsoft Libby Online (Natural)',
      'Samantha',
      'Daniel',
    ];
    for (const name of preferred) {
      const v = voices.find(v => v.name.includes(name));
      if (v) return v;
    }
    // Fallback to any en- voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  }, [voices]);

  // Estimate speaking duration (rough: ~150 words/min at rate 1)
  const estimateDuration = useCallback((txt: string, r: number) => {
    const words = txt.split(/\s+/).length;
    return (words / 150) * 60 / r; // seconds
  }, []);

  const startProgress = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    startTimeRef.current = Date.now();
    estimatedDuration.current = estimateDuration(text, rate);

    progressInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const pct = Math.min((elapsed / estimatedDuration.current) * 100, 99);
      setProgress(pct);
    }, 200);
  }, [text, rate, estimateDuration]);

  const stopProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const speak = useCallback(() => {
    if (!isSupported) return;

    speechSynthesis.cancel(); // stop any existing
    stopProgress();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = isMuted ? 0 : 1;
    utterance.pitch = 1;

    const voice = getVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      startProgress();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      stopProgress();
      onEnded?.();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      stopProgress();
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [text, rate, isMuted, isSupported, getVoice, onEnded, startProgress, stopProgress]);

  const togglePlay = () => {
    if (!isSupported) return;

    if (isPlaying && !isPaused) {
      speechSynthesis.pause();
      setIsPaused(true);
      stopProgress();
    } else if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
      // Adjust start time for progress
      const elapsed = (progress / 100) * estimatedDuration.current;
      startTimeRef.current = Date.now() - elapsed * 1000;
      startProgress();
    } else {
      speak();
    }
  };

  const restart = () => {
    setProgress(0);
    speak();
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    stopProgress();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (utteranceRef.current) {
      // SpeechSynthesis doesn't support live volume change, so restart
      if (isPlaying) {
        const wasProgress = progress;
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.volume = isMuted ? 1 : 0; // toggle
        const voice = getVoice();
        if (voice) utterance.voice = voice;
        utterance.onend = () => {
          setIsPlaying(false);
          setProgress(100);
          stopProgress();
          onEnded?.();
        };
        utteranceRef.current = utterance;
        speechSynthesis.speak(utterance);
        setProgress(wasProgress);
      }
    }
  };

  const cycleRate = () => {
    const rates = [0.75, 1, 1.25, 1.5];
    const idx = rates.indexOf(rate);
    const next = rates[(idx + 1) % rates.length];
    setRate(next);
  };

  const formatTime = (pct: number) => {
    const totalSec = estimateDuration(text, rate);
    const sec = Math.floor((pct / 100) * totalSec);
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalTime = () => {
    const sec = Math.floor(estimateDuration(text, rate));
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className={cn('bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive', className)}>
        ⚠️ Your browser does not support text-to-speech. Please use Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div className={cn('bg-background border rounded-xl p-4 space-y-3', className)}>
      {/* Label */}
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Headphones className="h-4 w-4" />
        <span>{label}</span>
        {isPlaying && !isPaused && (
          <span className="flex gap-0.5 ml-1">
            <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
            <span className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
            <span className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.45s' }} />
          </span>
        )}
      </div>

      {/* Controls Row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full flex-shrink-0"
          onClick={togglePlay}
        >
          {isPlaying && !isPaused ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        {/* Restart */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={restart}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Stop */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={stop}
          disabled={!isPlaying && !isPaused}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div className="w-full h-2 bg-border rounded-full relative">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-200 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-primary rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(progress)}</span>
            <span>{totalTime()}</span>
          </div>
        </div>

        {/* Playback Speed */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs font-mono flex-shrink-0"
          onClick={cycleRate}
        >
          {rate}x
        </Button>

        {/* Mute */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={toggleMute}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
