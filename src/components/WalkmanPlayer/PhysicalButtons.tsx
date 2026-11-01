import React from 'react';
import { Play, Square, Pause, RotateCcw, FastForward, Rewind } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

interface PhysicalButtonsProps {
  isPlaying: boolean;
  isPaused: boolean;
  isLoopingAB: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onToggleAB: () => void;
  onEject?: () => void;
}

export const PhysicalButtons: React.FC<PhysicalButtonsProps> = ({
  isPlaying,
  isPaused,
  isLoopingAB,
  onPlay,
  onPause,
  onStop,
  onRewind,
  onFastForward,
  onToggleAB,
}) => {
  return (
    <div className="w-full select-none">
      {/* Piano-Key Mechanical Rack Bar */}
      <div className="bg-gradient-to-b from-neutral-900 via-neutral-850 to-neutral-900 p-2 sm:p-2.5 rounded-2xl border-2 border-neutral-700 border-b-4 border-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_8px_16px_rgba(0,0,0,0.4)]">
        
        {/* Subtle molded header */}
        <div className="flex items-center justify-between px-1 pb-1 mb-1.5 text-[8px] sm:text-[9px] font-mono tracking-widest text-neutral-400 font-bold uppercase border-b border-neutral-800">
          <span>MECH TAPE TRANSPORT</span>
          <span className="text-amber-400">PIANO KEYS</span>
        </div>

        {/* 6 Heavy-duty mechanical piano keys */}
        <div className="grid grid-cols-6 gap-1 sm:gap-2">
          {/* 1. REWIND */}
          <button
            onClick={() => {
              soundFx.playClick('rewind');
              onRewind();
            }}
            title="Riavvolgi 5s"
            className="group relative flex flex-col items-center justify-between py-1.5 sm:py-2 px-0.5 rounded-lg bg-gradient-to-b from-neutral-700 via-neutral-750 to-neutral-850 hover:from-neutral-650 hover:to-neutral-800 active:translate-y-1 border-t-2 border-l border-r border-neutral-500 border-b-[4px] border-black shadow-[0_4px_0_#171717] active:shadow-none active:border-b-2 transition-all cursor-pointer min-h-[46px] sm:min-h-[52px]"
          >
            <div className="w-4 h-1 bg-neutral-500/80 rounded-full mb-0.5"></div>
            <Rewind className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-200 group-hover:text-white" />
            <span className="text-[8px] sm:text-[9px] font-mono font-black text-neutral-300 tracking-tighter">
              REW
            </span>
          </button>

          {/* 2. PLAY (Locks down when playing) */}
          <button
            onClick={() => {
              soundFx.playClick('play');
              onPlay();
            }}
            title="Avvia Riproduzione"
            className={`group relative flex flex-col items-center justify-between py-1.5 sm:py-2 px-0.5 rounded-lg transition-all cursor-pointer min-h-[46px] sm:min-h-[52px] ${
              isPlaying && !isPaused
                ? 'translate-y-1 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 border-t border-amber-400 border-l border-r border-amber-900 border-b-2 border-black shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]'
                : 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 border-t-2 border-l border-r border-amber-300 border-b-[4px] border-amber-950 shadow-[0_4px_0_#78350f] active:translate-y-1 active:shadow-none active:border-b-2'
            }`}
          >
            <div className={`w-4 h-1 rounded-full mb-0.5 ${isPlaying && !isPaused ? 'bg-amber-400/50' : 'bg-amber-200/90'}`}></div>
            <Play className={`w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ${isPlaying && !isPaused ? 'text-white' : 'text-neutral-950'}`} />
            <span className={`text-[8px] sm:text-[9px] font-mono font-black tracking-wider ${isPlaying && !isPaused ? 'text-amber-100' : 'text-neutral-950'}`}>
              PLAY
            </span>
          </button>

          {/* 3. FAST FORWARD */}
          <button
            onClick={() => {
              soundFx.playClick('ff');
              onFastForward();
            }}
            title="Avanza 5s"
            className="group relative flex flex-col items-center justify-between py-1.5 sm:py-2 px-0.5 rounded-lg bg-gradient-to-b from-neutral-700 via-neutral-750 to-neutral-850 hover:from-neutral-650 hover:to-neutral-800 active:translate-y-1 border-t-2 border-l border-r border-neutral-500 border-b-[4px] border-black shadow-[0_4px_0_#171717] active:shadow-none active:border-b-2 transition-all cursor-pointer min-h-[46px] sm:min-h-[52px]"
          >
            <div className="w-4 h-1 bg-neutral-500/80 rounded-full mb-0.5"></div>
            <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-200 group-hover:text-white" />
            <span className="text-[8px] sm:text-[9px] font-mono font-black text-neutral-300 tracking-tighter">
              FF
            </span>
          </button>

          {/* 4. STOP */}
          <button
            onClick={() => {
              soundFx.playClick('stop');
              onStop();
            }}
            title="Ferma Nastro"
            className="group relative flex flex-col items-center justify-between py-1.5 sm:py-2 px-0.5 rounded-lg bg-gradient-to-b from-neutral-700 via-neutral-750 to-neutral-850 hover:from-neutral-650 hover:to-neutral-800 active:translate-y-1 border-t-2 border-l border-r border-neutral-500 border-b-[4px] border-black shadow-[0_4px_0_#171717] active:shadow-none active:border-b-2 transition-all cursor-pointer min-h-[46px] sm:min-h-[52px]"
          >
            <div className="w-4 h-1 bg-neutral-500/80 rounded-full mb-0.5"></div>
            <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-neutral-200 group-hover:text-white" />
            <span className="text-[8px] sm:text-[9px] font-mono font-black text-neutral-300 tracking-tighter">
              STOP
            </span>
          </button>

          {/* 5. PAUSE */}
          <button
            onClick={() => {
              soundFx.playClick('pause');
              onPause();
            }}
            title="Pausa Meccanica"
            className={`group relative flex flex-col items-center justify-between py-1.5 sm:py-2 px-0.5 rounded-lg transition-all cursor-pointer min-h-[46px] sm:min-h-[52px] ${
              isPaused
                ? 'translate-y-1 bg-gradient-to-b from-cyan-800 via-cyan-900 to-cyan-950 border-t border-cyan-400 border-b-2 border-black shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]'
                : 'bg-gradient-to-b from-neutral-700 via-neutral-750 to-neutral-850 hover:from-neutral-650 hover:to-neutral-800 border-t-2 border-l border-r border-neutral-500 border-b-[4px] border-black shadow-[0_4px_0_#171717] active:translate-y-1 active:shadow-none active:border-b-2'
            }`}
          >
            <div className={`w-4 h-1 rounded-full mb-0.5 ${isPaused ? 'bg-cyan-400/50' : 'bg-neutral-500/80'}`}></div>
            <Pause className={`w-3.5 h-3.5 ${isPaused ? 'text-cyan-300' : 'text-neutral-200 group-hover:text-white'}`} />
            <span className={`text-[8px] sm:text-[9px] font-mono font-black tracking-tighter ${isPaused ? 'text-cyan-300' : 'text-neutral-300'}`}>
              PAUSE
            </span>
          </button>

          {/* 6. A-B LOOP */}
          <button
            onClick={() => {
              soundFx.playClick('switch');
              onToggleAB();
            }}
            title="Loop A-B Frase Dettato"
            className={`group relative flex flex-col items-center justify-between py-1.5 sm:py-2 px-0.5 rounded-lg transition-all cursor-pointer min-h-[46px] sm:min-h-[52px] ${
              isLoopingAB
                ? 'translate-y-1 bg-gradient-to-b from-purple-800 via-purple-900 to-purple-950 border-t border-purple-400 border-b-2 border-black shadow-[inset_0_3px_6px_rgba(0,0,0,0.7)]'
                : 'bg-gradient-to-b from-neutral-700 via-neutral-750 to-neutral-850 hover:from-neutral-650 hover:to-neutral-800 border-t-2 border-l border-r border-neutral-500 border-b-[4px] border-black shadow-[0_4px_0_#171717] active:translate-y-1 active:shadow-none active:border-b-2'
            }`}
          >
            <div className={`w-4 h-1 rounded-full mb-0.5 ${isLoopingAB ? 'bg-purple-400/50' : 'bg-neutral-500/80'}`}></div>
            <RotateCcw className={`w-3.5 h-3.5 ${isLoopingAB ? 'text-purple-300 animate-spin-reverse' : 'text-neutral-200 group-hover:text-white'}`} />
            <span className={`text-[8px] sm:text-[9px] font-mono font-black tracking-tighter ${isLoopingAB ? 'text-purple-300' : 'text-neutral-300'}`}>
              A-B
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
