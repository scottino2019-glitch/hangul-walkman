import fs from 'fs';
import path from 'path';

// Ensure public directories exist
const publicDir = path.resolve(process.cwd(), 'public');
const audioDir = path.resolve(publicDir, 'audio');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

// SVG Icon - Retro 90s cassette player with Chinese character 听 (Listen) & 汉 (Han)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b4252"/>
      <stop offset="40%" stop-color="#2e3440"/>
      <stop offset="100%" stop-color="#1e222a"/>
    </linearGradient>
    <linearGradient id="tapeWindow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#14171d"/>
      <stop offset="100%" stop-color="#0d0f13"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#e76f51"/>
      <stop offset="100%" stop-color="#f4a261"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Background base -->
  <rect width="512" height="512" rx="96" fill="#181a20"/>
  
  <!-- Outer Walkman Casing -->
  <rect x="36" y="36" width="440" height="440" rx="44" fill="url(#bodyGrad)" stroke="#4c566a" stroke-width="4" filter="url(#shadow)"/>
  
  <!-- Top brand plate -->
  <path d="M 60 48 L 452 48 A 20 20 0 0 1 472 68 L 472 108 L 40 108 L 40 68 A 20 20 0 0 1 60 48 Z" fill="#252a34"/>
  <rect x="60" y="70" width="18" height="18" rx="4" fill="#e76f51"/>
  <text x="88" y="85" fill="#eceff4" font-family="system-ui, sans-serif" font-weight="900" font-size="20" letter-spacing="2">HANZI·WALK</text>
  <text x="360" y="84" fill="#88c0d0" font-family="monospace" font-weight="bold" font-size="14">AUTO-REVERSE</text>

  <!-- Cassette Compartment Window -->
  <rect x="76" y="130" width="360" height="230" rx="18" fill="url(#tapeWindow)" stroke="#222731" stroke-width="6"/>
  
  <!-- Cassette Tape Shell inside window -->
  <rect x="100" y="150" width="312" height="190" rx="12" fill="#d8dee9" stroke="#4c566a" stroke-width="3"/>
  <rect x="120" y="170" width="272" height="110" rx="8" fill="#e5e9f0"/>
  
  <!-- Cassette Label with Chinese character -->
  <rect x="135" y="180" width="242" height="50" rx="4" fill="url(#accentGrad)"/>
  <text x="150" y="212" fill="#ffffff" font-family="system-ui, 'Noto Sans SC', sans-serif" font-weight="bold" font-size="24">中文听写 · DICTATION</text>
  
  <!-- Left Reel -->
  <circle cx="185" cy="255" r="32" fill="#2e3440" stroke="#d8dee9" stroke-width="4"/>
  <circle cx="185" cy="255" r="14" fill="#eceff4"/>
  <circle cx="185" cy="255" r="6" fill="#2e3440"/>
  <!-- Spokes -->
  <line x1="185" y1="227" x2="185" y2="283" stroke="#e5e9f0" stroke-width="3"/>
  <line x1="157" y1="255" x2="213" y2="255" stroke="#e5e9f0" stroke-width="3"/>

  <!-- Right Reel -->
  <circle cx="327" cy="255" r="32" fill="#2e3440" stroke="#d8dee9" stroke-width="4"/>
  <circle cx="327" cy="255" r="14" fill="#eceff4"/>
  <circle cx="327" cy="255" r="6" fill="#2e3440"/>
  <!-- Spokes -->
  <line x1="327" y1="227" x2="327" y2="283" stroke="#e5e9f0" stroke-width="3"/>
  <line x1="299" y1="255" x2="355" y2="255" stroke="#e5e9f0" stroke-width="3"/>
  
  <!-- Tape Bridge -->
  <rect x="225" y="248" width="62" height="14" rx="3" fill="#884a39"/>

  <!-- Lower mechanical control bar -->
  <rect x="76" y="385" width="360" height="60" rx="10" fill="#20242c" stroke="#323846" stroke-width="2"/>
  
  <!-- Chunky tactile buttons -->
  <g transform="translate(90, 396)">
    <!-- REW -->
    <rect x="0" y="0" width="55" height="38" rx="6" fill="#434c5e" stroke="#2e3440" stroke-width="2"/>
    <path d="M 22 13 L 13 19 L 22 25 Z M 34 13 L 25 19 L 34 25 Z" fill="#eceff4"/>
    
    <!-- PLAY (Orange accent) -->
    <rect x="68" y="0" width="70" height="38" rx="6" fill="#e76f51" stroke="#bf533b" stroke-width="2"/>
    <path d="M 100 13 L 112 19 L 100 25 Z" fill="#ffffff"/>
    
    <!-- FF -->
    <rect x="151" y="0" width="55" height="38" rx="6" fill="#434c5e" stroke="#2e3440" stroke-width="2"/>
    <path d="M 174 13 L 183 19 L 174 25 Z M 186 13 L 195 19 L 186 25 Z" fill="#eceff4"/>
    
    <!-- STOP -->
    <rect x="219" y="0" width="55" height="38" rx="6" fill="#434c5e" stroke="#2e3440" stroke-width="2"/>
    <rect x="239" y="14" width="14" height="14" rx="2" fill="#eceff4"/>
    
    <!-- PAUSE -->
    <rect x="287" y="0" width="45" height="38" rx="6" fill="#434c5e" stroke="#2e3440" stroke-width="2"/>
    <rect x="301" y="14" width="4" height="14" rx="1" fill="#eceff4"/>
    <rect x="310" y="14" width="4" height="14" rx="1" fill="#eceff4"/>
  </g>
</svg>`;

fs.writeFileSync(path.resolve(publicDir, 'icon.svg'), svgIcon, 'utf-8');
console.log('Created /public/icon.svg');
