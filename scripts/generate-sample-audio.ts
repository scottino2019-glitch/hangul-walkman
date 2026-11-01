import fs from 'fs';
import path from 'path';

// Generate a valid WAV audio file with pleasant retro warm cassette tone sequence
function generateWavFile(durationSec: number, frequencies: number[]): Buffer {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const numChannels = 1; // mono
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write audio samples: subtle warm analog hum + melodic pentatonic tones
  const segmentLen = Math.floor(numSamples / frequencies.length);
  for (let i = 0; i < numSamples; i++) {
    const segIdx = Math.min(frequencies.length - 1, Math.floor(i / segmentLen));
    const freq = frequencies[segIdx];
    const t = i / sampleRate;

    // Harmonic bell/flute tone with smooth envelope
    const envelope = Math.sin((Math.PI * (i % segmentLen)) / segmentLen);
    const wave = Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * freq * 2 * t) * 0.2;
    // Slight tape saturation
    const sampleVal = Math.floor(wave * envelope * 0.4 * 32767);
    buffer.writeInt16LE(sampleVal, 44 + i * 2);
  }

  return buffer;
}

const audioDir = path.resolve(process.cwd(), 'public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const files = [
  { name: 'topik1_01_saluti.mp3', tones: [440, 523.25, 659.25, 587.33, 523.25], sec: 4 },
  { name: 'topik1_02_nazionalita.mp3', tones: [392, 440, 523.25, 440, 392], sec: 5 },
  { name: 'topik1_03_tempo.mp3', tones: [523.25, 587.33, 659.25, 783.99], sec: 5 },
  { name: 'topik1_04_ristorante.mp3', tones: [349.23, 392, 440, 523.25, 440], sec: 6 },
  { name: 'topik2_01_spesa.mp3', tones: [440, 493.88, 523.25, 587.33], sec: 6 },
  { name: 'topik2_02_strada.mp3', tones: [523.25, 659.25, 783.99, 659.25], sec: 6 },
  { name: 'topik2_03_meteo.mp3', tones: [392, 440, 523.25, 587.33, 659.25], sec: 6 },
  { name: 'topik2_04_treno.mp3', tones: [440, 554.37, 659.25, 830.61], sec: 6 },
  { name: 'topik2_05_fine_settimana.mp3', tones: [349.23, 440, 523.25, 659.25], sec: 7 },
  { name: 'topik3_01_studio.mp3', tones: [523.25, 587.33, 659.25, 783.99, 880], sec: 7 },
  { name: 'topik3_02_cultura_te.mp3', tones: [329.63, 392, 440, 493.88, 587.33], sec: 7 },
  { name: 'topik3_03_tecnologia.mp3', tones: [440, 523.25, 587.33, 659.25, 783.99], sec: 7 },
  { name: 'topik3_04_ecologia.mp3', tones: [392, 440, 523.25, 659.25, 783.99, 880], sec: 8 },
  { name: 'topik3_05_lettura.mp3', tones: [392, 493.88, 587.33, 659.25, 880], sec: 8 }
];

for (const f of files) {
  const filePath = path.join(audioDir, f.name);
  if (!fs.existsSync(filePath)) {
    const buf = generateWavFile(f.sec, f.tones);
    fs.writeFileSync(filePath, buf);
    console.log(`Generated sample audio: ${f.name}`);
  }
}

// Also update README in public/audio explaining how to add real MP3s
const readmeContent = `# Cartella Audio per Dettati in Lingua Coreana

In questa cartella puoi inserire i tuoi file audio in formato **MP3** (es. \`lezione1.mp3\`, \`topik1_dialogo.mp3\`).

## Come aggiungere un nuovo dettato in coreano:
1. Copia il tuo file \`.mp3\` in questa cartella: \`/public/audio/tuo_file.mp3\`
2. Modifica il file \`/public/audio/dettati.txt\` aggiungendo una riga nel formato:
   \`Difficoltà | tuo_file.mp3 | Titolo Esercizio | Frase in coreano (Hangul)\`

L'app supporta:
- Riproduzione diretta di file MP3 reali
- Sintesi vocale nativa coreana ad alta fedeltà (\`Web Speech API ko-KR\`) con controllo di velocità e pause
- Esercizi di trascrizione Hangul con calcolo del punteggio e correzione sillaba per sillaba
`;

fs.writeFileSync(path.join(audioDir, 'README.md'), readmeContent, 'utf-8');
console.log('Korean audio sample generator updated.');
