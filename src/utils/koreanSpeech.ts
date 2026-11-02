/**
 * Client-side native Korean speech synthesis utility (Web Speech API ko-KR)
 * Robust implementation engineered for Chromium iFrames, Safari, and Firefox.
 * - Handles asynchronous voiceschanged loading
 * - Fixes Chromium iFrame auto-pause bug by explicitly resuming SpeechSynthesis
 * - Retains active SpeechSynthesisUtterance references to prevent garbage collection
 * - Supports variable playback rate and volume
 */

const activeUtterances: SpeechSynthesisUtterance[] = [];
let isSpeaking = false;
let isPaused = false;
let keepAliveTimer: number | null = null;
let currentOnEndCallback: (() => void) | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

// Pre-load voices on module import
function refreshVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedVoices = list;
    }
  } catch (err) {
    console.warn('Error fetching voices:', err);
  }
  return cachedVoices;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  refreshVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      refreshVoices();
    };
  }
}

export function getKoreanVoice(): SpeechSynthesisVoice | null {
  const voices = refreshVoices();
  if (voices.length === 0) return null;

  // 1. Exact match for ko-KR or ko_KR
  const exactKR = voices.find((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'ko-kr';
  });
  if (exactKR) return exactKR;

  // 2. Any voice starting with 'ko'
  const anyKO = voices.find((v) => v.lang.toLowerCase().startsWith('ko'));
  if (anyKO) return anyKO;

  // 3. Name containing Korean / 한국어 / ko-kr
  const nameMatch = voices.find((v) => {
    const n = v.name.toLowerCase();
    return n.includes('korean') || n.includes('한국') || n.includes('ko-kr');
  });
  if (nameMatch) return nameMatch;

  return null;
}

function clearKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

function startKeepAlive() {
  clearKeepAlive();
  // Standard Chromium workaround: every 4 seconds poke speech synthesis resume
  // to prevent browser audio cut-off on longer sentences
  keepAliveTimer = window.setInterval(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 4000);
}

export function speakKoreanText(
  text: string,
  rate: number = 1.0,
  volume: number = 1.0,
  onEnd?: () => void,
  onBoundary?: (charIndex: number) => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Web Speech API not supported on this browser.');
    if (onEnd) onEnd();
    return;
  }

  const clean = text.trim();
  if (!clean) {
    if (onEnd) onEnd();
    return;
  }

  // Ensure any stuck speech is cancelled
  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.warn('speechSynthesis cancel warning:', err);
  }

  // Fix Chromium iframe issue: immediately resume
  try {
    window.speechSynthesis.resume();
  } catch (err) {
    console.warn('speechSynthesis resume warning:', err);
  }

  isSpeaking = true;
  isPaused = false;
  currentOnEndCallback = onEnd || null;

  // Short 40ms timeout ensures cancel() does not drop the newly queued utterance
  setTimeout(() => {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      // Always poke resume right before speak
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'ko-KR';
      utterance.rate = Math.max(0.6, Math.min(1.4, rate));
      utterance.volume = Math.max(0.05, Math.min(1.0, volume));
      utterance.pitch = 1.0;

      const voice = getKoreanVoice();
      if (voice) {
        utterance.voice = voice;
      }

      // Retain reference in module array to protect from garbage collection
      activeUtterances.length = 0;
      activeUtterances.push(utterance);

      utterance.onstart = () => {
        isSpeaking = true;
        isPaused = false;
        startKeepAlive();
      };

      if (onBoundary) {
        utterance.onboundary = (e) => {
          if (typeof e.charIndex === 'number' && onBoundary) {
            onBoundary(e.charIndex);
          }
        };
      }

      utterance.onend = () => {
        activeUtterances.length = 0;
        isSpeaking = false;
        isPaused = false;
        clearKeepAlive();
        if (currentOnEndCallback) {
          currentOnEndCallback();
        }
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis utterance event:', e);
        activeUtterances.length = 0;
        isSpeaking = false;
        isPaused = false;
        clearKeepAlive();
        if (currentOnEndCallback) {
          currentOnEndCallback();
        }
      };

      window.speechSynthesis.speak(utterance);

      // Force resume once more immediately after speak for iframe compatibility
      window.speechSynthesis.resume();
    } catch (err) {
      console.error('Failed to trigger Korean speech:', err);
      activeUtterances.length = 0;
      isSpeaking = false;
      isPaused = false;
      clearKeepAlive();
      if (onEnd) onEnd();
    }
  }, 40);
}

export function stopKoreanSpeech(): void {
  isSpeaking = false;
  isPaused = false;
  activeUtterances.length = 0;
  currentOnEndCallback = null;
  clearKeepAlive();

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (err) {
      console.warn('Error stopping speech:', err);
    }
  }
}

export function pauseKoreanSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking) {
    isPaused = true;
    try {
      window.speechSynthesis.pause();
    } catch (err) {
      console.warn('Error pausing speech:', err);
    }
  }
}

export function resumeKoreanSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    isPaused = false;
    try {
      window.speechSynthesis.resume();
    } catch (err) {
      console.warn('Error resuming speech:', err);
    }
  }
}
