import React, { useEffect, useState } from 'react';
import { DictationItem } from '../../types/dictation';
import { soundFx } from '../../utils/audioEffects';

interface WalkmanDisplayProps {
  currentTrack: DictationItem | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  isLoopingAB: boolean;
  abPoints: { a: number | null; b: number | null };
  playbackRate: number;
  autoPauseDuration: number;
  tapeCounter: number;
  onResetCounter: () => void;
  audioSource: 'mp3' | 'speech';
}

export const WalkmanDisplay: React.FC<WalkmanDisplayProps> = ({
  currentTrack,
  isPlaying,
  isPaused,
  currentTime,
  duration,
  isLoopingAB,
  abPoints,
  playbackRate,
  autoPauseDuration,
  tapeCounter,
  onResetCounter,
  audioSource,
}) => {
  // Stereo Peak Level Meter simulation
  const [vuLeft, setVuLeft] = useState(0);
  const [vuRight, setVuRight] = useState(0);

  useEffect(() => {
    if (!isPlaying || isPaused) {
      setVuLeft((prev) => (prev !== 0 ? 0 : prev));
      setVuRight((prev) => (prev !== 0 ? 0 : prev));
      return;
    }

    const interval = setInterval(() => {
      const base = 0.35 + Math.random() * 0.5;
      const jitter = (Math.random() - 0.5) * 0.2;
      setVuLeft(Math.min(1, Math.max(0.1, base + jitter)));
      setVuRight(Math.min(1, Math.max(0.1, base - jitter * 0.8)));
    }, 80);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const counterStr = (tapeCounter % 1000).toString().padStart(3, '0');

  return (
    <div className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-xl p-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_2px_6px_rgba(0,0,0,0.4)]">
      {/* Top Header: Mechanical Tape Counter & Indicators (Responsive, guaranteed not to overflow) */}
      <div className="flex flex-wrap items-center justify-between gap-y-1.5 pb-2 mb-2 border-b border-neutral-800 text-[11px] font-mono">
        {/* Mechanical 3-digit Counter with Plunger Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-neutral-400 font-bold uppercase tracking-wider text-[9px]">COUNTER</span>
          <div className="flex items-center bg-black border-2 border-neutral-700 px-1.5 py-0.5 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]">
            <span className="text-white font-black tracking-widest text-xs font-mono">{counterStr}</span>
          </div>
          <button
            onClick={() => {
              soundFx.playClick('switch');
              onResetCounter();
            }}
            title="Azzera Contatore"
            className="w-5 h-5 rounded-full bg-gradient-to-b from-neutral-600 to-neutral-800 hover:from-neutral-500 hover:to-neutral-700 active:scale-90 border border-neutral-500 flex items-center justify-center text-[8px] font-bold text-white shadow-xs cursor-pointer"
          >
            0
          </button>
        </div>

        {/* Source & Battery Indicator */}
        <div className="flex items-center gap-2 text-[10px] shrink-0 ml-auto">
          <div className="flex items-center gap-1 text-neutral-400">
            <span className="hidden xs:inline">SRC:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800 ${audioSource === 'mp3' ? 'text-amber-400' : 'text-cyan-400'}`}>
              {audioSource === 'mp3' ? 'MP3' : 'VOCE'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 shrink-0">
            <span className="text-[9px]">BATT</span>
            <span className="text-xs tracking-tighter">■■■□</span>
          </div>
        </div>
      </div>

      {/* Authentic 90s Reflective Gray-Green LCD Screen */}
      <div className="relative bg-[#9bb392] border-2 border-[#768a6e] rounded-lg p-2.5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)] font-mono text-[#182615] overflow-hidden">
        {/* Subtle LCD pixel matrix grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(24,38,21,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(24,38,21,0.06)_1px,transparent_1px)] bg-[size:3px_3px] pointer-events-none z-10"></div>

        {/* First Row: Status Flags */}
        <div className="flex items-center justify-between text-xs tracking-wider z-20 relative font-bold">
          <div className="flex items-center gap-2">
            {isPlaying && !isPaused ? (
              <span className="bg-[#1e301b] text-[#a5c29b] px-1.5 py-0.5 rounded text-[11px] animate-pulse">
                ▶ PLAY
              </span>
            ) : isPaused ? (
              <span className="bg-[#1e301b] text-[#e0cf79] px-1.5 py-0.5 rounded text-[11px]">
                ⏸ PAUSE
              </span>
            ) : (
              <span className="bg-[#788f70] text-[#1e301b] px-1.5 py-0.5 rounded text-[11px]">
                ■ STOP
              </span>
            )}

            {isLoopingAB && (
              <span className="bg-[#1e301b] text-[#9bd6c2] px-1.5 py-0.5 rounded text-[10px]">
                A-B LOOP [{abPoints.a?.toFixed(0) || '0'}s-{abPoints.b?.toFixed(0) || 'E'}s]
              </span>
            )}

            {autoPauseDuration > 0 && (
              <span className="bg-[#1e301b] text-[#d69bc2] px-1.5 py-0.5 rounded text-[10px]">
                PAUSA {autoPauseDuration}s
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-black">
            <span>{playbackRate.toFixed(2)}x</span>
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Second Row: Track Info Title & Level */}
        <div className="mt-2 pt-1 border-t border-[#768a6e] flex items-center justify-between z-20 relative">
          <div className="truncate max-w-[70%]">
            <span className="font-bold text-xs tracking-wide">
              {currentTrack ? currentTrack.title : 'NESSUNA CASSETTA CARICATA'}
            </span>
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e301b] text-[#a5c29b] font-black shrink-0">
            {currentTrack?.difficulty.toUpperCase() || 'STOP'}
          </div>
        </div>

        {/* Third Row: Stereo Peak Bar Meters */}
        <div className="mt-2 pt-1.5 border-t border-[#768a6e] flex items-center justify-between gap-3 z-20 relative">
          {/* Left Channel */}
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[9px] font-black w-2.5">L</span>
            <div className="flex-1 flex gap-0.5 h-2 bg-[#82997b] p-0.5 rounded-xs">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                const threshold = (idx + 1) / 8;
                const isLit = vuLeft >= threshold;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-xs transition-colors duration-75 ${
                      isLit ? 'bg-[#182615]' : 'bg-transparent'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Right Channel */}
          <div className="flex-1 flex items-center gap-1.5">
            <span className="text-[9px] font-black w-2.5">R</span>
            <div className="flex-1 flex gap-0.5 h-2 bg-[#82997b] p-0.5 rounded-xs">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
                const threshold = (idx + 1) / 8;
                const isLit = vuRight >= threshold;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-xs transition-colors duration-75 ${
                      isLit ? 'bg-[#182615]' : 'bg-transparent'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[8px] font-bold">PEAK</span>
          </div>
        </div>
      </div>
    </div>
  );
};
