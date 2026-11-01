import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DictationItem, AudioSettings, DictationAttempt } from '../../types/dictation';
import { TapeReel } from './TapeReel';
import { WalkmanDisplay } from './WalkmanDisplay';
import { PhysicalButtons } from './PhysicalButtons';
import { WalkmanControls } from './WalkmanControls';
import {
  speakKoreanText,
  stopKoreanSpeech,
  pauseKoreanSpeech,
  resumeKoreanSpeech,
} from '../../utils/koreanSpeech';
import { soundFx } from '../../utils/audioEffects';
import {
  Palette,
  Disc,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  FileAudio,
} from 'lucide-react';

export type WalkmanColorway = 'sports_yellow' | 'brushed_silver' | 'cobalt_teal';

interface WalkmanChassisProps {
  currentTrack: DictationItem | null;
  trackIndex: number;
  totalTracks: number;
  dictations: DictationItem[];
  onSelectTrack: (track: DictationItem) => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  settings: AudioSettings;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
  attempts?: Record<string, DictationAttempt>;
  onSentenceComplete?: () => void;
}

export const WalkmanChassis: React.FC<WalkmanChassisProps> = ({
  currentTrack,
  trackIndex,
  totalTracks,
  dictations,
  onSelectTrack,
  onPrevTrack,
  onNextTrack,
  settings,
  onUpdateSettings,
  attempts = {},
  onSentenceComplete,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tapeRackRef = useRef<HTMLDivElement | null>(null);

  // Colorway state (default: 90s Sports Yellow)
  const [colorway, setColorway] = useState<WalkmanColorway>('sports_yellow');

  // Tape filter state
  const [selectedFilter, setSelectedFilter] = useState<string>('TUTTI');

  // Collapsible Audio Options ("a scomparsa") under the track/display
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tapeCounter, setTapeCounter] = useState(0);

  // A-B Loop State
  const [isLoopingAB, setIsLoopingAB] = useState(false);
  const [abPoints, setAbPoints] = useState<{ a: number | null; b: number | null }>({
    a: null,
    b: null,
  });

  const pauseTimerRef = useRef<number | null>(null);
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  // Scroll active tape item into view when currentTrack changes
  useEffect(() => {
    if (!currentTrack || !tapeRackRef.current) return;
    const activeEl = tapeRackRef.current.querySelector(`[data-tape-id="${currentTrack.id}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentTrack?.id]);

  // Handle Audio Element Loading
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
    setAbPoints({ a: null, b: null });
    setIsLoopingAB(false);

    audioRef.current.playbackRate = settings.playbackRate;
    audioRef.current.volume = settings.volume;

    const targetSrc = currentTrack.audioSrc;
    if (!audioRef.current.src.endsWith(targetSrc)) {
      audioRef.current.src = targetSrc;
      audioRef.current.load();
    }
  }, [currentTrack?.id, currentTrack?.audioSrc]);

  // Sync settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = settings.playbackRate;
      audioRef.current.volume = settings.volume;
    }
  }, [settings.playbackRate, settings.volume]);

  // Tape counter increment
  useEffect(() => {
    if (!isPlaying || isPaused) return;
    const interval = setInterval(() => {
      setTapeCounter((prev) => prev + 1);
    }, 1000 / settings.playbackRate);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, settings.playbackRate]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      stopKoreanSpeech();
    };
  }, []);

  const currentPhrase = currentTrack ? (currentTrack.koreanText || currentTrack.chineseText || '') : '';

  // Play
  const handlePlay = useCallback(() => {
    if (!currentTrack) {
      if (dictations.length > 0) {
        onSelectTrack(dictations[0]);
      }
      return;
    }

    const phraseToPlay = currentTrack.koreanText || currentTrack.chineseText || '';

    if (settings.voiceMode === 'speech_synthesis') {
      setIsPlaying(true);
      setIsPaused(false);
      speakKoreanText(
        phraseToPlay,
        settings.playbackRate,
        () => {
          setIsPlaying(false);
          setIsPaused(false);
          if (onSentenceComplete) onSentenceComplete();
        }
      );
      return;
    }

    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsPaused(false);
          })
          .catch((err) => {
            console.warn('Audio playback error, fallback to speech synthesis:', err);
            speakKoreanText(
              phraseToPlay,
              settings.playbackRate,
              () => {
                setIsPlaying(false);
                setIsPaused(false);
                if (onSentenceComplete) onSentenceComplete();
              }
            );
          });
      }
    }
  }, [currentTrack, settings.voiceMode, settings.playbackRate, onSentenceComplete]);

  // Pause
  const handlePause = useCallback(() => {
    if (!isPlaying) return;

    if (settings.voiceMode === 'speech_synthesis') {
      if (isPaused) {
        resumeKoreanSpeech();
        setIsPaused(false);
      } else {
        pauseKoreanSpeech();
        setIsPaused(true);
      }
      return;
    }

    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play();
        setIsPaused(false);
      } else {
        audioRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isPlaying, isPaused, settings.voiceMode]);

  // Stop
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setIsPaused(false);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);

    if (settings.voiceMode === 'speech_synthesis') {
      stopKoreanSpeech();
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, [settings.voiceMode]);

  // Rewind
  const handleRewind = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
      setCurrentTime(audioRef.current.currentTime);
    } else {
      handlePlay();
    }
  }, [handlePlay]);

  // Fast forward
  const handleFastForward = useCallback(() => {
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [duration]);

  // A-B Loop
  const handleToggleAB = useCallback(() => {
    if (!isLoopingAB) {
      const a = currentTime;
      const b = Math.min(duration || 10, a + 4);
      setAbPoints({ a, b });
      setIsLoopingAB(true);
    } else {
      setIsLoopingAB(false);
      setAbPoints({ a: null, b: null });
    }
  }, [isLoopingAB, currentTime, duration]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    setCurrentTime(curr);

    if (isLoopingAB && abPoints.a !== null && abPoints.b !== null) {
      if (curr >= abPoints.b) {
        audioRef.current.currentTime = abPoints.a;
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsPaused(false);

    if (settings.autoPauseDuration > 0) {
      pauseTimerRef.current = window.setTimeout(() => {
        handlePlay();
      }, settings.autoPauseDuration * 1000);
    }

    if (onSentenceComplete) {
      onSentenceComplete();
    }
  };

  const scrollTapeRack = (direction: 'left' | 'right') => {
    if (!tapeRackRef.current) return;
    tapeRackRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  const filteredDictations = dictations.filter((d) => {
    if (selectedFilter === 'TUTTI') return true;
    if (selectedFilter === 'PRINCIPIANTE') return d.difficulty === 'Principiante';
    if (selectedFilter === 'INTERMEDIO') return d.difficulty === 'Intermedio';
    if (selectedFilter === 'AVANZATO') return d.difficulty === 'Avanzato';
    return true;
  });

  const colorwayStyles = {
    sports_yellow: {
      bodyGrad: 'bg-gradient-to-b from-[#f59e0b] via-[#fbbf24] to-[#d97706]',
      border: 'border-[#b45309]',
    },
    brushed_silver: {
      bodyGrad: 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400',
      border: 'border-slate-500',
    },
    cobalt_teal: {
      bodyGrad: 'bg-gradient-to-b from-teal-500 via-cyan-600 to-teal-700',
      border: 'border-teal-800',
    },
  }[colorway];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center select-none">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={handleEnded}
        onError={(e) => {
          console.warn('Audio element error event:', e);
        }}
      />

      {/* WALKMAN BODY CASING */}
      <div
        className={`w-full rounded-3xl ${colorwayStyles.bodyGrad} border-4 ${colorwayStyles.border} p-3.5 sm:p-5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_12px_28px_rgba(0,0,0,0.25)] space-y-3.5`}
      >
        {/* ============================================================== */}
        {/* 1. MENÙ DEI NASTRI SCORREVOLE IN ALTO (INTEGRATO NELLA SCOCCA) */}
        {/* ============================================================== */}
        <div className="bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-3 shadow-md space-y-2">
          {/* Header Bar: Brand, Colore Walkman, Conteggio */}
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-neutral-800 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-4 bg-red-600 rounded-xs"></div>
              <span className="font-mono font-black text-xs sm:text-sm tracking-widest text-neutral-100">
                SPORTS WM-90
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                NASTRI ({dictations.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Palette Selector */}
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800">
                <Palette className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
                <button
                  onClick={() => setColorway('sports_yellow')}
                  title="Giallo Sports"
                  className={`w-4 h-4 rounded-full bg-amber-500 transition border ${
                    colorway === 'sports_yellow' ? 'border-white scale-110 shadow-xs' : 'border-neutral-700 opacity-60'
                  }`}
                />
                <button
                  onClick={() => setColorway('brushed_silver')}
                  title="Argento"
                  className={`w-4 h-4 rounded-full bg-slate-300 transition border ${
                    colorway === 'brushed_silver' ? 'border-white scale-110 shadow-xs' : 'border-neutral-700 opacity-60'
                  }`}
                />
                <button
                  onClick={() => setColorway('cobalt_teal')}
                  title="Teal"
                  className={`w-4 h-4 rounded-full bg-teal-500 transition border ${
                    colorway === 'cobalt_teal' ? 'border-white scale-110 shadow-xs' : 'border-neutral-700 opacity-60'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Filtri rapidi per difficoltà & frecce scorrimento */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex flex-wrap gap-1 font-mono text-xs">
              {(['TUTTI', 'PRINCIPIANTE', 'INTERMEDIO', 'AVANZATO'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    soundFx.playClick('switch');
                    setSelectedFilter(cat);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg font-bold border transition cursor-pointer text-xs ${
                    selectedFilter === cat
                      ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-2xs'
                      : 'bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border-neutral-800'
                  }`}
                >
                  {cat === 'TUTTI'
                    ? 'Tutti'
                    : cat === 'PRINCIPIANTE'
                    ? 'Base'
                    : cat === 'INTERMEDIO'
                    ? 'Intermedio'
                    : 'Avanzato'}
                </button>
              ))}
            </div>

            {/* Frecce scorrimento orizzontale */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => scrollTapeRack('left')}
                className="p-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
                title="Scorri indietro"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => scrollTapeRack('right')}
                className="p-1 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition cursor-pointer"
                title="Scorri avanti"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* MENÙ SCORREVOLE INTEGRATO DEI NASTRI (Fluido, chiaro, ad alto contrasto) */}
          <div
            ref={tapeRackRef}
            className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-950 scroll-smooth"
          >
            {filteredDictations.map((track) => {
              const isSelected = track.id === currentTrack?.id;
              const attempt = attempts[track.id];

              const diffColor =
                track.difficulty === 'Principiante'
                  ? 'border-l-amber-500 bg-amber-50/90 text-amber-950'
                  : track.difficulty === 'Intermedio'
                  ? 'border-l-sky-500 bg-sky-50/90 text-sky-950'
                  : 'border-l-rose-500 bg-rose-50/90 text-rose-950';

              return (
                <button
                  key={track.id}
                  data-tape-id={track.id}
                  onClick={() => {
                    soundFx.playClick('switch');
                    onSelectTrack(track);
                  }}
                  className={`shrink-0 w-48 sm:w-56 text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between shadow-2xs group ${
                    isSelected
                      ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-400 shadow-xs'
                      : 'bg-[#faf8f5] hover:bg-white border-stone-300 hover:border-amber-400'
                  } border-l-4 ${diffColor}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1 font-mono text-[10px]">
                    <span className="font-bold uppercase tracking-wide">
                      {track.difficulty}
                    </span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 font-black text-amber-800 bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">
                        <Disc className="w-3 h-3 text-amber-700 animate-spin" />
                        IN USO
                      </span>
                    ) : attempt?.completed ? (
                      <span className="flex items-center gap-0.5 font-bold text-emerald-700">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        {attempt.score}%
                      </span>
                    ) : (
                      <span className="text-stone-400 group-hover:text-amber-700 font-bold">
                        CARICA ▶
                      </span>
                    )}
                  </div>

                  {/* Titolo Traccia */}
                  <div className="font-sans font-bold text-xs sm:text-sm text-stone-950 truncate">
                    {track.title}
                  </div>

                  {/* Frase in Coreano */}
                  <div className="font-sans text-xs sm:text-sm font-semibold text-stone-850 truncate mt-0.5">
                    {track.koreanText || track.chineseText}
                  </div>

                  {/* File audio */}
                  <div className="mt-1.5 pt-1 border-t border-stone-200/80 flex items-center justify-between text-[10px] font-mono text-stone-600">
                    <span className="flex items-center gap-1 truncate max-w-[130px]">
                      <FileAudio className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{track.audioSrc.split('/').pop()}</span>
                    </span>
                    <span className="font-bold text-stone-500 shrink-0">C-60</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. SUBITO SOTTO: NOME DELLA TRACCIA & DISPLAY + CONTROLLI AUDIO A SCOMPARSA */}
        {/* ========================================================================= */}
        <div className="bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-3 shadow-md space-y-2">
          {/* Barra Nome Traccia con Frecce ◄ ► */}
          <div className="flex items-center justify-between gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800 font-mono text-xs">
            <button
              onClick={onPrevTrack}
              title="Traccia Precedente"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 truncate px-1 text-center">
              <span className="text-[10px] text-neutral-500 font-bold shrink-0">
                {trackIndex + 1}/{totalTracks}
              </span>
              <span className="font-bold text-amber-400 text-xs sm:text-sm tracking-wide truncate">
                {currentTrack ? currentTrack.title : 'Nessun nastro caricato'}
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold shrink-0">
                {currentTrack?.difficulty || 'N/A'}
              </span>
            </div>

            <button
              onClick={onNextTrack}
              title="Traccia Successiva"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-900 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* LCD Display 90s con Contatore e VU Meter */}
          <WalkmanDisplay
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            isPaused={isPaused}
            currentTime={currentTime}
            duration={duration || 6}
            isLoopingAB={isLoopingAB}
            abPoints={abPoints}
            playbackRate={settings.playbackRate}
            autoPauseDuration={settings.autoPauseDuration}
            tapeCounter={tapeCounter}
            onResetCounter={() => setTapeCounter(0)}
            audioSource={settings.voiceMode === 'speech_synthesis' ? 'speech' : 'mp3'}
          />

          {/* REGOLAZIONI A SCOMPARSA (Solo scritta REGOLAZIONI e Mostra/Nascondi) */}
          <div className="pt-1">
            <button
              onClick={() => {
                soundFx.playClick('switch');
                setIsOptionsOpen((prev) => !prev);
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-mono transition cursor-pointer"
            >
              <span className="font-bold tracking-wider uppercase text-neutral-200">
                REGOLAZIONI
              </span>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <span>{isOptionsOpen ? 'Nascondi' : 'Mostra'}</span>
                {isOptionsOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Pannello a scomparsa con i controlli audio completi */}
            {isOptionsOpen && (
              <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                <WalkmanControls
                  playbackRate={settings.playbackRate}
                  onPlaybackRateChange={(rate) => onUpdateSettings({ playbackRate: rate })}
                  autoPauseDuration={settings.autoPauseDuration}
                  onAutoPauseDurationChange={(dur) => onUpdateSettings({ autoPauseDuration: dur })}
                  volume={settings.volume}
                  onVolumeChange={(vol) => onUpdateSettings({ volume: vol })}
                  audioSource={settings.voiceMode === 'speech_synthesis' ? 'speech' : 'mp3'}
                  onAudioSourceChange={(src) =>
                    onUpdateSettings({
                      voiceMode: src === 'speech' ? 'speech_synthesis' : 'native_audio',
                    })
                  }
                  tapeEq={settings.tapeEq}
                  onTapeEqChange={(eq) => onUpdateSettings({ tapeEq: eq })}
                  soundFxEnabled={settings.soundFxEnabled}
                  onToggleSoundFx={() =>
                    onUpdateSettings({ soundFxEnabled: !settings.soundFxEnabled })
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3. SOTTO: IL NASTRO (SPORTELLO CON CASSETTA CHE GIRA)          */}
        {/* ============================================================== */}
        <div className="relative rounded-2xl bg-neutral-950 border-3 border-neutral-800 p-2 sm:p-3 shadow-[inset_0_4px_12px_rgba(0,0,0,0.9)] overflow-hidden">
          <div className="relative z-10 w-full flex items-center justify-center">
            <TapeReel
              isPlaying={isPlaying && !isPaused}
              progress={progress}
              speed={settings.playbackRate}
              currentTrack={currentTrack}
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4. SOTTO: I COMANDI DI RIPRODUZIONE (TASTI MECCANICI PIANO)    */}
        {/* ============================================================== */}
        <div>
          <PhysicalButtons
            isPlaying={isPlaying}
            isPaused={isPaused}
            isLoopingAB={isLoopingAB}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onRewind={handleRewind}
            onFastForward={handleFastForward}
            onToggleAB={handleToggleAB}
          />
        </div>
      </div>
    </div>
  );
};

