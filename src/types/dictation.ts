export type DifficultyLevel = 'Principiante' | 'Intermedio' | 'Avanzato' | 'Personalizzato';

export interface DictationItem {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  audioSrc: string; // Percorso del file (es. /audio/topik1_01_saluti.mp3) o blob locale
  koreanText: string; // Testo in coreano Hangul da trascrivere
  chineseText?: string; // Retrocompatibilità
  romanization?: string; // Romanizzazione Revised Romanization (RR)
  pinyin?: string; // Retrocompatibilità
  translation?: string; // Traduzione italiana
  topikLevel?: number; // Livello TOPIK (1-6)
  vocabulary?: Array<{ hangul: string; romanization?: string; meaning: string }>;
  notes?: string;
  isCustom?: boolean;
  createdAt?: string;
}

export interface DictationAttempt {
  dictationId: string;
  date: string;
  userText: string;
  score: number; // 0-100
  accuracyChars: number;
  totalChars: number;
  completed: boolean;
}

export interface AudioSettings {
  playbackRate: number; // 0.7, 0.85, 1.0, 1.15
  autoPauseDuration: number; // 0, 3, 5, 8
  soundFxEnabled: boolean;
  tapeEq: 'NORMAL' | 'CrO2' | 'METAL';
  volume: number;
  voiceMode: 'native_audio' | 'speech_synthesis';
}
