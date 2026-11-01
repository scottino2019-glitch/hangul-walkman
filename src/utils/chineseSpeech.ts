/**
 * Client-side native Chinese speech synthesis utility (No server, No AI keys required)
 * Robust multi-sentence engine: splits long texts into natural sentence chunks,
 * retains all active SpeechSynthesisUtterance references to prevent Chromium garbage collection,
 * and queues all sentences to read the entire passage completely.
 */

// Global pool to prevent Garbage Collection from prematurely killing active utterances in Chromium/WebKit
const activeUtterances: SpeechSynthesisUtterance[] = [];
let isSpeaking = false;
let isPaused = false;
let keepAliveTimer: number | null = null;
let currentOnEndCallback: (() => void) | null = null;

export function getChineseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const zhCN = voices.find((v) =>
    v.lang.toLowerCase().includes('zh-cn') ||
    v.lang.toLowerCase().includes('cmn-hans') ||
    v.lang.toLowerCase().includes('cmn')
  );
  if (zhCN) return zhCN;
  const anyZH = voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
  return anyZH || null;
}

/**
 * Splits Chinese text into sentence chunks by full stops, exclamations, questions, semicolons,
 * or commas if a segment is overly long, ensuring the browser engine never chokes or truncates.
 */
export function splitChineseIntoChunks(text: string): string[] {
  if (!text) return [];
  const clean = text.trim();
  if (!clean) return [];

  // Split by major sentence terminators: 。！？!?；;\n
  const rawSentences = clean.split(/([。！？!?；;\n]+)/g);
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
  // Standard Chromium workaround: every 8s momentarily poke speech synthesis to prevent browser cut-off
  keepAliveTimer = window.setInterval(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 8000);
}

export function speakChineseText(
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
  stopChineseSpeech();

  const chunks = splitChineseIntoChunks(text);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  isSpeaking = true;
  isPaused = false;
  currentOnEndCallback = onEnd || null;

  const voice = getChineseVoice();
  const effectiveRate = Math.max(0.5, Math.min(1.5, rate));

  chunks.forEach((chunk, index) => {
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = 'zh-CN';
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
      // Last chunk completes the whole reading
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

export function stopChineseSpeech(): void {
  isSpeaking = false;
  isPaused = false;
  activeUtterances.length = 0;
  currentOnEndCallback = null;
  clearKeepAlive();

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function pauseChineseSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking) {
    isPaused = true;
    window.speechSynthesis.pause();
  }
}

export function resumeChineseSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && isPaused) {
    isPaused = false;
    window.speechSynthesis.resume();
  }
}
