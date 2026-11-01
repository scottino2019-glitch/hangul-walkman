import { DictationItem, DictationAttempt, DifficultyLevel } from '../types/dictation';

const STORAGE_CUSTOM_KEY = 'hangulwalk_custom_dictations_v2';
const STORAGE_ATTEMPTS_KEY = 'hangulwalk_attempts_v2';

// Open IndexedDB for audio Blobs
const DB_NAME = 'HangulWalkAudioDB';
const DB_VERSION = 1;
const AUDIO_STORE_NAME = 'audio_files';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AUDIO_STORE_NAME);
    store.put(blob, id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save audio blob:', err);
  }
}

export async function getAudioBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openAudioDB();
    const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
    const store = tx.objectStore(AUDIO_STORE_NAME);
    const req = store.get(id);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Parses simple 1-line-per-dictation text format from dettati.txt:
 * Difficoltà | File MP3 | Titolo | Frase in coreano
 */
export function parseDettatiTxt(rawText: string): DictationItem[] {
  const lines = rawText.split('\n');
  const items: DictationItem[] = [];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return; // ignore comments & empty lines

    const parts = line.split('|').map((p) => p.trim());
    if (parts.length >= 3) {
      let difficulty: DifficultyLevel = 'Principiante';
      const diffStr = parts[0].toLowerCase();
      if (diffStr.includes('intermedio') || diffStr.includes('medio')) difficulty = 'Intermedio';
      else if (diffStr.includes('avanzato') || diffStr.includes('difficile')) difficulty = 'Avanzato';

      let fileName = parts[1] || '';
      if (fileName && !fileName.startsWith('/') && !fileName.startsWith('http')) {
        fileName = `/audio/${fileName}`;
      }

      let title = '';
      let korean = '';

      if (parts.length === 3) {
        title = `Esercizio ${items.length + 1}`;
        korean = parts[2];
      } else {
        title = parts[2] || `Esercizio ${items.length + 1}`;
        korean = parts.slice(3).join(' | '); // in case text has pipes
      }

      items.push({
        id: `txt-${items.length + 1}`,
        title,
        difficulty,
        audioSrc: fileName || '/audio/topik1_01_saluti.mp3',
        koreanText: korean,
        chineseText: korean,
      });
    } else if (items.length > 0 && line) {
      // Continuation line for the previous dictation text
      const lastItem = items[items.length - 1];
      const curr = lastItem.koreanText || lastItem.chineseText || '';
      lastItem.koreanText = curr ? `${curr} ${line}` : line;
      lastItem.chineseText = lastItem.koreanText;
    }
  });

  return items;
}

/**
 * Direct loader for /audio/dettati.txt
 * No JSON or complicated schema: reads the text file directly.
 */
export async function fetchDefaultDictations(): Promise<DictationItem[]> {
  try {
    const txtRes = await fetch('/audio/dettati.txt');
    if (txtRes.ok) {
      const text = await txtRes.text();
      const parsed = parseDettatiTxt(text);
      if (parsed.length > 0) return parsed;
    }
    return [];
  } catch (err) {
    console.warn('Error reading /audio/dettati.txt:', err);
    return [];
  }
}

export function getCustomDictations(): DictationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomDictation(item: DictationItem): void {
  const existing = getCustomDictations();
  const index = existing.findIndex((d) => d.id === item.id);
  let updated: DictationItem[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = item;
  } else {
    updated = [item, ...existing];
  }
  localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(updated));
}

export function deleteCustomDictation(id: string): void {
  const existing = getCustomDictations();
  const updated = existing.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(updated));
}

export function getDictationAttempts(): Record<string, DictationAttempt> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDictationAttempt(attempt: DictationAttempt): void {
  const existing = getDictationAttempts();
  const prev = existing[attempt.dictationId];
  const bestScore = prev ? Math.max(prev.score, attempt.score) : attempt.score;

  existing[attempt.dictationId] = {
    ...attempt,
    score: bestScore,
    completed: attempt.completed || (prev ? prev.completed : false),
  };
  localStorage.setItem(STORAGE_ATTEMPTS_KEY, JSON.stringify(existing));
}

export function generateDettatiTxtContent(items: DictationItem[]): string {
  let content = '# ==========================================================\n';
  content += '# HANGUL·WALK - ELENCO DEI DETTATI IN LINGUA COREANA\n';
  content += '# 1 RIGA PER DETTATO: Difficoltà | Nome file MP3 | Titolo | Frase\n';
  content += '# ==========================================================\n\n';
  items.forEach((item) => {
    const mp3Name = (item.audioSrc || '').replace('/audio/', '');
    const cleanKorean = (item.koreanText || item.chineseText || '').replace(/\r?\n/g, ' ').trim();
    content += `${item.difficulty} | ${mp3Name} | ${item.title} | ${cleanKorean}\n`;
  });
  return content;
}
