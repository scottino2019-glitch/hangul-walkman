import React from 'react';
import { Volume2, VolumeX, Sliders, Mic, Disc3, Headphones } from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';

interface WalkmanControlsProps {
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  autoPauseDuration: number;
  onAutoPauseDurationChange: (duration: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  audioSource: 'mp3' | 'speech';
  onAudioSourceChange: (source: 'mp3' | 'speech') => void;
  tapeEq: 'NORMAL' | 'CrO2' | 'METAL';
  onTapeEqChange: (eq: 'NORMAL' | 'CrO2' | 'METAL') => void;
  soundFxEnabled: boolean;
  onToggleSoundFx: () => void;
}

export const WalkmanControls: React.FC<WalkmanControlsProps> = ({
  playbackRate,
  onPlaybackRateChange,
  autoPauseDuration,
  onAutoPauseDurationChange,
  volume,
  onVolumeChange,
  audioSource,
  onAudioSourceChange,
  tapeEq,
  onTapeEqChange,
  soundFxEnabled,
  onToggleSoundFx,
}) => {
  return (
    <div className="w-full bg-neutral-900 border-2 border-neutral-700/80 rounded-xl p-3 shadow-md select-none text-xs font-mono">
      {/* Upper strip: Knurled Volume Dial & 3.5mm Headphone Jack */}
      <div className="flex flex-wrap items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-800 gap-3">
        {/* Knurled Volume Thumb Dial */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-neutral-300 font-bold text-[11px]">
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-neutral-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
            <span>VOLUME:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500">MIN</span>
            {/* Textured physical volume thumb slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-24 sm:w-28 accent-amber-500 bg-neutral-800 h-2 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-neutral-500">MAX</span>
            <span className="text-amber-400 font-bold text-xs w-7 text-right">
              {Math.round(volume * 10)}
            </span>
          </div>
        </div>

        {/* 3.5mm Stereo Jack & Clack Sound FX Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-neutral-400 bg-neutral-950 px-2 py-1 rounded border border-neutral-800">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-500 border border-amber-200 flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            </div>
            <Headphones className="w-3 h-3 text-neutral-400" />
            <span className="font-bold">PHONES 3.5mm</span>
          </div>

          <button
            onClick={() => {
              soundFx.playClick('switch');
              onToggleSoundFx();
            }}
            title="Attiva/Disattiva 'Clack' Meccanico dei Pulsanti"
            className={`text-[9px] px-2 py-1 rounded font-bold border transition cursor-pointer ${
              soundFxEnabled
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                : 'bg-neutral-950 text-neutral-500 border-neutral-700'
            }`}
          >
            AUDIO CLICK: {soundFxEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Grid of 3 Physical Slide Switches */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. SPEED / PITCH TRIM */}
        <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 text-[10px] text-neutral-400 font-bold uppercase">
            <span>VELOCITÀ NASTRO</span>
            <span className="text-amber-400">{playbackRate.toFixed(2)}x</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0.7, 0.85, 1.0, 1.15].map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  soundFx.playClick('switch');
                  onPlaybackRateChange(rate);
                }}
                className={`py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-amber-500 text-neutral-950 border-amber-300 shadow-xs'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                }`}
              >
                {rate === 0.7 ? '0.7x' : rate === 0.85 ? '0.85x' : rate === 1.0 ? '1.0x' : '1.15x'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. AUTO-PAUSE DICTATION */}
        <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 text-[10px] text-neutral-400 font-bold uppercase">
            <span>PAUSA SCRITTURA</span>
            <span className="text-cyan-400">
              {autoPauseDuration === 0 ? 'DISATTIVA' : `${autoPauseDuration}s`}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[0, 3, 5, 8].map((sec) => (
              <button
                key={sec}
                onClick={() => {
                  soundFx.playClick('switch');
                  onAutoPauseDurationChange(sec);
                }}
                className={`py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                  autoPauseDuration === sec
                    ? 'bg-cyan-500 text-neutral-950 border-cyan-300 shadow-xs'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                }`}
              >
                {sec === 0 ? 'OFF' : `${sec}s`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. AUDIO SOURCE (MP3 / SPEECH) */}
        <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5 text-[10px] text-neutral-400 font-bold uppercase">
            <span>SORGENTE AUDIO</span>
            <Sliders className="w-3 h-3 text-neutral-400" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => {
                soundFx.playClick('switch');
                onAudioSourceChange('mp3');
              }}
              className={`flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                audioSource === 'mp3'
                  ? 'bg-amber-600 text-white border-amber-400'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
              }`}
            >
              <Disc3 className="w-3 h-3" />
              <span>MP3 CASSETTE</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick('switch');
                onAudioSourceChange('speech');
              }}
              className={`flex items-center justify-center gap-1 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                audioSource === 'speech'
                  ? 'bg-cyan-600 text-white border-cyan-400'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
              }`}
            >
              <Mic className="w-3 h-3" />
              <span>VOCE ko-KR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tape EQ Selector row (Normal / CrO2 / Metal) */}
      <div className="mt-2.5 pt-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-bold">EQUALIZZATORE NASTRO (DOLBY NR):</span>
          <div className="flex gap-1">
            {(['NORMAL', 'CrO2', 'METAL'] as const).map((eq) => (
              <button
                key={eq}
                onClick={() => {
                  soundFx.playClick('switch');
                  onTapeEqChange(eq);
                }}
                className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                  tapeEq === eq
                    ? 'bg-neutral-700 text-amber-300 border-amber-400/50'
                    : 'bg-neutral-850 hover:bg-neutral-750 text-neutral-400 border-neutral-800'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
        <span className="text-neutral-500 italic hidden sm:inline">ANTI-ROLLING MECH</span>
      </div>
    </div>
  );
};
