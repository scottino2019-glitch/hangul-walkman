/**
 * Client-side native Korean speech synthesis utility (Web Speech API ko-KR)
 * Splits Korean passages into natural sentence segments,
 * retains SpeechSynthesisUtterance references to avoid Chromium GC issues,
 * and handles pause/resume/stop with accurate voice selection.
 */

const activeUtterances: SpeechSynthesisUtterance[] = [];
let isSpeaking = false;
let isPaused = false;
let keepAliveTimer: number | null = null;
let currentOnEndCallback: (() => void) | null = null;

export function getKoreanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const koKR = voices.find((v) =>
    v.lang.toLowerCase().includes('ko-kr') ||
    v.lang.toLowerCase().includes('ko_kr') ||
    v.lang.toLowerCase().startsWith('ko')
  );
  if (koKR) return koKR;
  const anyKO = voices.find((v) => v.lang.toLowerCase().includes('korean'));
  return anyKO || null;
}

/**
 * Splits Korean text into sentence chunks by full stops, exclamations, questions, semicolons,
 * or line breaks, ensuring smooth uninterrupted speech synthesis.
 */
export function splitKoreanIntoChunks(text: string): string[] {
  if (!text) return [];
  const clean = text.trim();
  if (!clean) return [];

  // Split by major sentence terminators: . ! ? ; \n
  const rawSentences = clean.split(/([.!?;\n]+)/g);
  const chunks: string[] = [];

  for (let i = 0; i < rawSentences.length; i += 2) {
    const sentence = rawSentences[i]?.trim() || '';
    const punctuation = rawSentences[i + 1] || '';
    const full = (sentence + punctuation).trim();
    if (full) chunks.push(full);
  }

  return chunks.length > 0 ? chunks : [clean];
}

function clearKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function startKeepAlive() {
  clearKeepAlive();
  // Standard Chromium workaround: poke speech synthesis to prevent browser cut-off on longer texts
  keepAliveTimer = window.setInterval(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 8000);
}

export function speakKoreanText(
  text: string,
  rate: number = 1.0,
  onEnd?: () => void,
  onBoundary?: (charIndex: number) => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  stopKoreanSpeech();

  const chunks = splitKoreanIntoChunks(text);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  isSpeaking = true;
  isPaused = false;
  currentOnEndCallback = onEnd || null;

  const voice = getKoreanVoice();
  const effectiveRate = Math.max(0.5, Math.min(1.5, rate));

  chunks.forEach((chunk, index) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = 'ko-KR';
    utterance.rate = effectiveRate;
    utterance.pitch = 1.0;
    if (voice) {
      utterance.voice = voice;
    }

    // Retain reference in pool so GC doesn't delete it
    activeUtterances.push(utterance);

    if (onBoundary) {
      utterance.onboundary = (e) => {
        if (typeof e.charIndex === 'number' && onBoundary) {
          onBoundary(e.charIndex);
        }
      };
    }

    if (index === chunks.length - 1) {
      utterance.onend = () => {
        activeUtterances.length = 0;
        isSpeaking = false;
        clearKeepAlive();
        if (currentOnEndCallback) {
          currentOnEndCallback();
        }
      };
      utterance.onerror = () => {
        activeUtterances.length = 0;
        isSpeaking = false;
        clearKeepAlive();
        if (currentOnEndCallback) {
          currentOnEndCallback();
        }
      };
    }

    window.speechSynthesis.speak(utterance);
  });

  startKeepAlive();
}

export function stopKoreanSpeech(): void {
  isSpeaking = false;
  isPaused = false;
  activeUtterances.length = 0;
  currentOnEndCallback = null;
  clearKeepAlive();

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function pauseKoreanSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking) {
    isPaused = true;
    window.speechSynthesis.pause();
  }
}

export function resumeKoreanSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && isPaused) {
    isPaused = false;
    window.speechSynthesis.resume();
  }
}
