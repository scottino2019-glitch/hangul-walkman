/**
 * Client-side native Korean speech synthesis utility (Web Speech API ko-KR)
 * 
 * Engineered to completely prevent audio cut-off / truncation on Chromium, Safari and Mobile:
 * 1. Chunks long texts by sentence punctuation (. ! ? ~ ; \n) and commas if long
 * 2. Plays chunks sequentially in a queue (chunk 1 -> chunk 2 -> ...)
 * 3. Never uses destructive pause()/resume() timers which interrupt speech in Chrome
 * 4. Pins current utterance to window global to prevent V8 Garbage Collection
 * 5. Includes an automatic safety watchdog per chunk so playback never freezes
 */

let activeQueue: string[] = [];
let currentQueueIndex = 0;
let isSpeaking = false;
let isPaused = false;
let currentOnEndCallback: (() => void) | null = null;
let currentRate = 1.0;
let currentVolume = 1.0;
let chunkSafetyTimer: number | null = null;

// Global reference pool on window to prevent Chromium/V8 Garbage Collection
if (typeof window !== 'undefined') {
  (window as unknown as { __koreanUtterancePool?: SpeechSynthesisUtterance[] }).__koreanUtterancePool = [];
}

/**
 * Splits Korean text into natural sentence chunks by punctuation
 * ensuring each segment is short enough so the browser engine never cuts off.
 */
export function splitKoreanIntoChunks(text: string): string[] {
  if (!text) return [];
  const clean = text.trim();
  if (!clean) return [];

  // Split by major sentence terminators: . ! ? ~ ; \n
  const rawSegments = clean.split(/([.!?~;\n]+)/g);
  const chunks: string[] = [];

  for (let i = 0; i < rawSegments.length; i += 2) {
    const sentence = (rawSegments[i] || '').trim();
    const punct = (rawSegments[i + 1] || '').trim();
    const full = (sentence + (punct ? ' ' + punct : '')).trim();

    if (!full) continue;

    // If an individual sentence segment is still long (> 65 chars), split by comma/clause
    if (full.length > 65) {
      const subParts = full.split(/([,，]+)/g);
      for (let j = 0; j < subParts.length; j += 2) {
        const sub = (subParts[j] || '').trim();
        const subPunct = (subParts[j + 1] || '').trim();
        const subFull = (sub + (subPunct ? subPunct : '')).trim();
        if (subFull) chunks.push(subFull);
      }
    } else {
      chunks.push(full);
    }
  }

  return chunks.length > 0 ? chunks : [clean];
}

/**
 * Finds the best Korean voice available in the browser
 */
export function getKoreanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Exact match for ko-KR or ko_KR
  const exactKR = voices.find((v) => {
    const l = (v.lang || '').toLowerCase().replace('_', '-');
    return l === 'ko-kr';
  });
  if (exactKR) return exactKR;

  // 2. Any voice starting with 'ko'
  const anyKO = voices.find((v) => (v.lang || '').toLowerCase().startsWith('ko'));
  if (anyKO) return anyKO;

  // 3. Name containing Korean / 한국어
  const nameMatch = voices.find((v) => {
    const n = (v.name || '').toLowerCase();
    return n.includes('korean') || n.includes('한국') || n.includes('ko-kr');
  });
  if (nameMatch) return nameMatch;

  return null;
}

// Pre-warm voices
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

function clearSafetyTimer() {
  if (chunkSafetyTimer) {
    clearTimeout(chunkSafetyTimer);
    chunkSafetyTimer = null;
  }
}

/**
 * Plays the next chunk in the queue sequentially until the full passage is completed.
 */
function playNextChunk(): void {
  clearSafetyTimer();

  if (typeof window === 'undefined' || !window.speechSynthesis) {
    isSpeaking = false;
    isPaused = false;
    const cb = currentOnEndCallback;
    currentOnEndCallback = null;
    if (cb) cb();
    return;
  }

  // Finished all chunks or stopped
  if (!isSpeaking || currentQueueIndex >= activeQueue.length) {
    isSpeaking = false;
    isPaused = false;
    activeQueue = [];
    currentQueueIndex = 0;
    const cb = currentOnEndCallback;
    currentOnEndCallback = null;
    if (cb) cb();
    return;
  }

  const chunkText = activeQueue[currentQueueIndex];
  if (!chunkText || !chunkText.trim()) {
    currentQueueIndex++;
    playNextChunk();
    return;
  }

  // Ensure speech synthesis is active (resume if stalled)
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch {
    // ignore
  }

  const utterance = new SpeechSynthesisUtterance(chunkText);
  utterance.lang = 'ko-KR';
  utterance.rate = Math.max(0.6, Math.min(1.4, currentRate));
  utterance.volume = Math.max(0.1, Math.min(1.0, currentVolume));
  utterance.pitch = 1.0;

  const voice = getKoreanVoice();
  if (voice) {
    utterance.voice = voice;
  }

  // Retain in window pool so V8 Garbage Collector does not kill active utterance
  const win = window as unknown as { __koreanUtterancePool?: SpeechSynthesisUtterance[] };
  if (!win.__koreanUtterancePool) win.__koreanUtterancePool = [];
  win.__koreanUtterancePool.push(utterance);
  if (win.__koreanUtterancePool.length > 20) {
    win.__koreanUtterancePool.shift();
  }

  let chunkHandled = false;
  const advanceToNext = () => {
    if (chunkHandled) return;
    chunkHandled = true;
    clearSafetyTimer();
    currentQueueIndex++;
    // Slight 60ms breath between sentences for natural cadenced rhythm
    setTimeout(() => {
      if (isSpeaking && !isPaused) {
        playNextChunk();
      }
    }, 60);
  };

  utterance.onend = () => {
    advanceToNext();
  };

  utterance.onerror = (e) => {
    // If canceled manually via stop(), don't log warning
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('Speech chunk notification:', e.error);
    }
    advanceToNext();
  };

  // Safety watchdog: based on text length, if onend never fires due to browser bug, advance automatically
  const estimatedDurationMs = Math.max(4000, Math.ceil(chunkText.length * 350 / currentRate) + 2000);
  chunkSafetyTimer = window.setTimeout(() => {
    if (!chunkHandled && isSpeaking && !isPaused) {
      console.warn('Watchdog advancing chunk after timeout');
      advanceToNext();
    }
  }, estimatedDurationMs);

  window.speechSynthesis.speak(utterance);
}

/**
 * Speaks Korean text completely from beginning to end by streaming
 * natural sentence chunks sequentially without cutting off.
 */
export function speakKoreanText(
  text: string,
  rate: number = 1.0,
  volume: number = 1.0,
  onEnd?: () => void,
  onBoundary?: (charIndex: number) => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  const clean = text.trim();
  if (!clean) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech and reset queue
  stopKoreanSpeech();

  const chunks = splitKoreanIntoChunks(clean);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  activeQueue = chunks;
  currentQueueIndex = 0;
  isSpeaking = true;
  isPaused = false;
  currentOnEndCallback = onEnd || null;
  currentRate = rate;
  currentVolume = volume;

  // 30ms initial delay allows speechSynthesis.cancel() to fully clear before starting
  setTimeout(() => {
    if (isSpeaking) {
      playNextChunk();
    }
  }, 30);
}

export function stopKoreanSpeech(): void {
  clearSafetyTimer();
  isSpeaking = false;
  isPaused = false;
  activeQueue = [];
  currentQueueIndex = 0;
  currentOnEndCallback = null;

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
    clearSafetyTimer();
    try {
      window.speechSynthesis.pause();
    } catch (err) {
      console.warn('Error pausing speech:', err);
    }
  }
}

export function resumeKoreanSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis && isSpeaking && isPaused) {
    isPaused = false;
    try {
      window.speechSynthesis.resume();
      // If the browser dropped the utterance while paused, restart current chunk
      if (!window.speechSynthesis.speaking && currentQueueIndex < activeQueue.length) {
        playNextChunk();
      }
    } catch (err) {
      console.warn('Error resuming speech:', err);
    }
  }
}
