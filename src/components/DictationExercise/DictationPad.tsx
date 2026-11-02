import React, { useState, useEffect } from 'react';
import { DictationItem, DictationAttempt } from '../../types/dictation';
import {
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  Award,
  BookOpen,
  Volume2,
  Languages,
} from 'lucide-react';
import { soundFx } from '../../utils/audioEffects';
import { speakKoreanText } from '../../utils/koreanSpeech';

interface DictationPadProps {
  currentTrack: DictationItem | null;
  onSaveAttempt: (attempt: DictationAttempt) => void;
  previousAttempt?: DictationAttempt;
}

export const DictationPad: React.FC<DictationPadProps> = ({
  currentTrack,
  onSaveAttempt,
  previousAttempt,
}) => {
  const [userInput, setUserInput] = useState('');
  const [hasChecked, setHasChecked] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showRomanization, setShowRomanization] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [charDiff, setCharDiff] = useState<
    Array<{ char: string; expected?: string; status: 'correct' | 'wrong' }>
  >([]);

  // Reset when track changes
  useEffect(() => {
    setUserInput('');
    setHasChecked(false);
    setShowSolution(false);
    setScore(null);
    setCharDiff([]);
  }, [currentTrack?.id]);

  const cleanForComparison = (str: string) => {
    // Remove punctuation and extra whitespace for fair syllable accuracy
    return str.replace(/[.,!?~;:'"“”‘’\s\n\r—\-()[\]{}]/g, '');
  };

  const targetKoreanText = currentTrack ? (currentTrack.koreanText || currentTrack.chineseText || '') : '';

  const handleCheck = () => {
    if (!currentTrack || !targetKoreanText) return;
    soundFx.playClick('switch');

    const expectedRaw = targetKoreanText;
    const userClean = cleanForComparison(userInput);
    const expectedClean = cleanForComparison(expectedRaw);

    let matchCount = 0;
    const diff: Array<{ char: string; expected?: string; status: 'correct' | 'wrong' }> = [];

    const maxLen = Math.max(userClean.length, expectedClean.length);
    for (let i = 0; i < maxLen; i++) {
      const uChar = userClean[i] || '';
      const expChar = expectedClean[i] || '';

      if (uChar === expChar && uChar !== '') {
        matchCount++;
        diff.push({ char: uChar, status: 'correct' });
      } else {
        diff.push({
          char: uChar || '—',
          expected: expChar,
          status: 'wrong',
        });
      }
    }

    const calculatedScore = expectedClean.length > 0 ? Math.round((matchCount / expectedClean.length) * 100) : 0;
    setScore(calculatedScore);
    setCharDiff(diff);
    setHasChecked(true);

    onSaveAttempt({
      dictationId: currentTrack.id,
      date: new Date().toISOString(),
      userText: userInput,
      score: calculatedScore,
      accuracyChars: matchCount,
      totalChars: expectedClean.length,
      completed: calculatedScore >= 80,
    });
  };

  const handleReset = () => {
    soundFx.playClick('stop');
    setUserInput('');
    setHasChecked(false);
    setShowSolution(false);
    setScore(null);
    setCharDiff([]);
  };

  if (!currentTrack) {
    return (
      <div className="w-full bg-white border-2 border-stone-300 rounded-3xl p-6 text-center text-stone-500 shadow-xs">
        <BookOpen className="w-8 h-8 mx-auto mb-2 text-stone-400" />
        <p className="font-mono text-sm font-bold text-stone-700">Area Dettato Coreano</p>
        <p className="text-xs text-stone-500 mt-0.5">Seleziona una cassetta per iniziare l'ascolto e la scrittura in Hangul.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border-2 border-stone-300 rounded-3xl p-4 sm:p-6 shadow-sm text-stone-800 space-y-3.5">
      {/* Intestazione essenziale e pulita */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-wider text-stone-700 uppercase">
            AREA DETTATO · 받아쓰기
          </span>
          {currentTrack.topikLevel && (
            <span className="text-[10px] font-mono font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
              TOPIK {currentTrack.topikLevel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-stone-500">
          <span>{userInput.length} caratteri</span>
        </div>
      </div>

      {/* AREA TESTO COMPLETAMENTE LIBERA (Spaziosa, confortevole per Hangul) */}
      <div className="relative">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ascolta l'audio nel Walkman e scrivi qui la frase in coreano (Hangul)..."
          rows={5}
          className="w-full bg-[#fbfbfa] border-2 border-stone-300 focus:border-amber-500 focus:bg-white focus:outline-hidden rounded-2xl p-4 text-base sm:text-lg text-stone-900 placeholder:text-stone-400 font-sans tracking-wide leading-relaxed resize-y transition shadow-inner"
        />
      </div>

      {/* Barra pulsanti essenziale: Controlla, Ripulisci, Voce ko-KR e Mostra Testo */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          {/* Tasto principale CONVALIDA */}
          <button
            onClick={handleCheck}
            disabled={userInput.trim().length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 disabled:pointer-events-none text-stone-950 font-bold text-xs font-mono tracking-wider transition cursor-pointer shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>CONTROLLA DETTATO</span>
          </button>

          {/* Tasto RIPULISCI */}
          {userInput.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs font-semibold transition cursor-pointer border border-stone-300"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ripulisci</span>
            </button>
          )}
        </div>

        {/* Azioni secondarie (Pronuncia ko-KR e Mostra Testo) */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Pronuncia nativa coreana ko-KR */}
          <button
            onClick={() => {
              soundFx.playClick('switch');
              speakKoreanText(targetKoreanText, 0.9);
            }}
            title="Ascolta con voce nativa coreana ko-KR"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs font-semibold transition cursor-pointer border border-stone-300"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-600" />
            <span>Voce ko-KR</span>
          </button>

          {/* Mostra / Nascondi Soluzione */}
          <button
            onClick={() => {
              soundFx.playClick('switch');
              setShowSolution(!showSolution);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs font-semibold transition cursor-pointer border border-stone-300"
          >
            {showSolution ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showSolution ? 'Nascondi' : 'Testo'}</span>
          </button>
        </div>
      </div>

      {/* Soluzione (se richiesta dall'utente) */}
      {showSolution && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-200 text-xs font-mono space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between pb-1 border-b border-amber-200/80">
            <span className="text-amber-900 font-bold">FRASE ORIGINALE IN COREANO:</span>
            {currentTrack.romanization && (
              <button
                onClick={() => setShowRomanization(!showRomanization)}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1 cursor-pointer"
              >
                <Languages className="w-3 h-3" />
                <span>{showRomanization ? 'Nascondi Romanizzazione' : 'Mostra Romanizzazione (RR)'}</span>
              </button>
            )}
          </div>

          <p className="text-base sm:text-lg font-bold text-stone-900 font-sans tracking-wide leading-relaxed">
            {targetKoreanText}
          </p>

          {/* Romanizzazione (Revised Romanization) */}
          {(showRomanization || !currentTrack.translation) && currentTrack.romanization && (
            <div className="text-amber-800 font-mono text-xs pt-0.5">
              <span className="text-stone-500 font-bold mr-1">RR:</span>
              {currentTrack.romanization}
            </div>
          )}

          {/* Traduzione italiana */}
          {currentTrack.translation && (
            <div className="text-stone-700 text-xs italic pt-1 border-t border-amber-200/60">
              <span className="font-bold not-italic text-stone-500 mr-1">Italiano:</span>
              {currentTrack.translation}
            </div>
          )}

          {/* Vocabolario ed espressioni utili se presenti */}
          {currentTrack.vocabulary && currentTrack.vocabulary.length > 0 && (
            <div className="pt-2 border-t border-amber-200/60">
              <span className="text-[11px] font-bold text-stone-600 block mb-1">Vocabolario chiave:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentTrack.vocabulary.map((v, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-amber-300 text-[11px] text-stone-800"
                  >
                    <strong className="text-amber-900">{v.hangul}</strong>
                    {v.romanization && <span className="text-stone-500 text-[10px]">({v.romanization})</span>}
                    <span className="text-stone-600">→ {v.meaning}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentTrack.notes && (
            <div className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded-lg border border-amber-300">
              <strong>Nota grammaticale:</strong> {currentTrack.notes}
            </div>
          )}
        </div>
      )}

      {/* Risultato verifica sillaba per sillaba */}
      {hasChecked && (
        <div className="rounded-2xl bg-stone-50 border-2 border-stone-300 p-4 space-y-3 animate-in fade-in shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Award className={`w-5 h-5 ${score && score >= 80 ? 'text-amber-500' : 'text-stone-400'}`} />
              <span className="font-mono font-bold text-sm text-stone-900">
                Accuratezza Sillabe: <span className="text-amber-600 text-lg font-black">{score}%</span>
              </span>
            </div>
            <span
              className={`text-xs font-black font-mono px-3 py-0.5 rounded-full ${
                score && score >= 85
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : score && score >= 60
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}
            >
              {score && score >= 85 ? 'Eccellente! 참 잘했어요!' : score && score >= 60 ? 'Buono! 파이팅!' : 'Riascolta con il Walkman'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono text-stone-500 block mb-1.5 font-bold">
              CONFRONTO SILLABE HANGUL (Verde = Esatto, Rosso = Errato/Mancante):
            </span>
            <div className="max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-stone-200 flex flex-wrap gap-1.5">
              {charDiff.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center min-w-8 h-10 px-1 rounded-lg border-2 font-sans text-base font-bold ${
                    item.status === 'correct'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-red-50 border-red-400 text-red-700'
                  }`}
                >
                  <span>{item.char}</span>
                  {item.status === 'wrong' && item.expected && (
                    <span className="text-[8px] text-stone-600 font-mono font-normal">
                      {item.expected}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs font-mono space-y-1">
            <span className="text-stone-500 font-bold block">FRASE ATTESA:</span>
            <p className="text-sm font-bold text-stone-900 font-sans">{targetKoreanText}</p>
            {currentTrack.translation && (
              <p className="text-xs text-stone-600 italic">{currentTrack.translation}</p>
            )}
          </div>
        </div>
      )}

      {previousAttempt && (
        <div className="text-right text-[11px] font-mono text-stone-400">
          Miglior tentativo registrato: <span className="text-amber-600 font-bold">{previousAttempt.score}%</span>
        </div>
      )}
    </div>
  );
};
