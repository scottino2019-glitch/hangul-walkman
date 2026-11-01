import React from 'react';
import { DictationItem } from '../../types/dictation';

interface TapeReelProps {
  isPlaying: boolean;
  progress: number; // 0 to 1
  speed: number;
  currentTrack: DictationItem | null;
}

export const TapeReel: React.FC<TapeReelProps> = ({ isPlaying, progress, speed, currentTrack }) => {
  // Spool radius in SVG coordinate space (viewBox 0 0 360 200)
  // Left reel unwinds (radius shrinks from 38 to 16)
  // Right reel winds up (radius grows from 16 to 38)
  const leftRadius = 38 - progress * 20;
  const rightRadius = 18 + progress * 20;
  const spinSec = Math.max(0.6, 2 / (speed || 1));

  return (
    <div className="w-full h-full flex items-center justify-center select-none overflow-hidden p-1">
      <svg
        viewBox="0 0 360 200"
        className="w-full h-auto max-h-48 drop-shadow-md"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="cassetteShell" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e7e5e4" />
            <stop offset="50%" stopColor="#d6d3d1" />
            <stop offset="100%" stopColor="#a8a29e" />
          </linearGradient>
          <linearGradient id="tapeWindowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1c1917" />
            <stop offset="100%" stopColor="#0c0a09" />
          </linearGradient>
          <linearGradient id="labelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
          <linearGradient id="tapeBrown" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="50%" stopColor="#290e03" />
            <stop offset="100%" stopColor="#1c0701" />
          </linearGradient>
          <filter id="reelShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity={0.5} />
          </filter>
        </defs>

        {/* Outer Cassette Body (Beveled edges) */}
        <rect x="4" y="4" width="352" height="192" rx="10" fill="url(#cassetteShell)" stroke="#78716c" strokeWidth="2.5" />

        {/* 4 Corner Screws */}
        <circle cx="16" cy="16" r="3" fill="#a8a29e" stroke="#57534e" strokeWidth="0.8" />
        <line x1="14" y1="16" x2="18" y2="16" stroke="#44403c" strokeWidth="0.8" />
        <line x1="16" y1="14" x2="16" y2="18" stroke="#44403c" strokeWidth="0.8" />

        <circle cx="344" cy="16" r="3" fill="#a8a29e" stroke="#57534e" strokeWidth="0.8" />
        <line x1="342" y1="16" x2="346" y2="16" stroke="#44403c" strokeWidth="0.8" />
        <line x1="344" y1="14" x2="344" y2="18" stroke="#44403c" strokeWidth="0.8" />

        <circle cx="16" cy="184" r="3" fill="#a8a29e" stroke="#57534e" strokeWidth="0.8" />
        <circle cx="344" cy="184" r="3" fill="#a8a29e" stroke="#57534e" strokeWidth="0.8" />

        {/* Cassette Paper Label */}
        <rect x="24" y="24" width="312" height="66" rx="6" fill="url(#labelGrad)" stroke="#a8a29e" strokeWidth="1.2" />
        
        {/* Decorative Label Lines */}
        <line x1="28" y1="28" x2="332" y2="28" stroke="#dc2626" strokeWidth="1.5" />
        <line x1="28" y1="32" x2="332" y2="32" stroke="#2563eb" strokeWidth="1" />

        {/* Label Badge "SIDE A" */}
        <rect x="34" y="38" width="48" height="18" rx="3" fill="#dc2626" />
        <text x="58" y="51" fill="#ffffff" fontFamily="monospace" fontWeight="900" fontSize="10" textAnchor="middle">
          SIDE A
        </text>

        {/* Label Title Text */}
        <text x="90" y="52" fill="#1c1917" fontFamily="system-ui, sans-serif" fontWeight="bold" fontSize="12">
          {currentTrack ? (currentTrack.title.length > 24 ? currentTrack.title.substring(0, 24) + '...' : currentTrack.title) : '한국어 받아쓰기 · DICTATION'}
        </text>
        
        <text x="324" y="52" fill="#78716c" fontFamily="monospace" fontWeight="bold" fontSize="9" textAnchor="end">
          {currentTrack?.difficulty.toUpperCase() || 'C-60'}
        </text>

        {/* Handwritten lined pattern under title */}
        <line x1="34" y1="72" x2="326" y2="72" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
        <text x="36" y="82" fill="#64748b" fontFamily="monospace" fontSize="8">
          NORMAL BIAS 120µs EQ · SONY CORP. MADE IN JAPAN
        </text>

        {/* Central Smoked Window Area */}
        <rect x="42" y="94" width="276" height="72" rx="8" fill="url(#tapeWindowGrad)" stroke="#44403c" strokeWidth="2" />

        {/* Exposed magnetic tape band stretching between reels */}
        <rect x="80" y="125" width="200" height="12" fill="url(#tapeBrown)" opacity="0.9" />

        {/* LEFT REEL (Supply) */}
        <g transform="translate(105, 130)">
          {/* Brown tape roll */}
          <circle cx="0" cy="0" r={leftRadius} fill="url(#tapeBrown)" stroke="#572814" strokeWidth="1.5" />
          
          {/* White toothed spool hub */}
          <g style={{ transformOrigin: '0px 0px', animation: isPlaying ? `spinReel ${spinSec}s linear infinite` : 'none' }}>
            <circle cx="0" cy="0" r="18" fill="#f5f5f4" stroke="#78716c" strokeWidth="1.5" filter="url(#reelShadow)" />
            {/* Teeth */}
            <rect x="-2" y="-16" width="4" height="32" rx="1" fill="#78716c" />
            <rect x="-16" y="-2" width="32" height="4" rx="1" fill="#78716c" />
            <rect x="-2" y="-16" width="4" height="32" rx="1" fill="#78716c" transform="rotate(45)" />
            <rect x="-2" y="-16" width="4" height="32" rx="1" fill="#78716c" transform="rotate(-45)" />
            {/* Center drive hole */}
            <circle cx="0" cy="0" r="7" fill="#1c1917" stroke="#44403c" strokeWidth="1.2" />
          </g>
        </g>

        {/* CENTER TAPE INSPECTION GAUGE (Compact, no collision) */}
        <g transform="translate(180, 130)">
          <rect x="-24" y="-18" width="48" height="36" rx="4" fill="#1c1917" stroke="#57534e" strokeWidth="1" />
          <text x="0" y="-7" fill="#d97706" fontFamily="monospace" fontWeight="bold" fontSize="7" textAnchor="middle">
            TAPE
          </text>
          {/* Progress bar scale */}
          <rect x="-18" y="-2" width="36" height="5" rx="2" fill="#292524" />
          <rect x="-18" y="-2" width={Math.max(2, 36 * progress)} height="5" rx="2" fill="#f59e0b" />
          <text x="-16" y="12" fill="#a8a29e" fontFamily="monospace" fontSize="6">100</text>
          <text x="16" y="12" fill="#a8a29e" fontFamily="monospace" fontSize="6" textAnchor="end">0</text>
        </g>

        {/* RIGHT REEL (Take-up) */}
        <g transform="translate(255, 130)">
          {/* Brown tape roll */}
          <circle cx="0" cy="0" r={rightRadius} fill="url(#tapeBrown)" stroke="#572814" strokeWidth="1.5" />
          
          {/* White toothed spool hub */}
          <g style={{ transformOrigin: '0px 0px', animation: isPlaying ? `spinReel ${spinSec}s linear infinite` : 'none' }}>
            <circle cx="0" cy="0" r="18" fill="#f5f5f4" stroke="#78716c" strokeWidth="1.5" filter="url(#reelShadow)" />
            {/* Teeth */}
            <rect x="-2" y="-16" width="4" height="32" rx="1" fill="#78716c" />
            <rect x="-16" y="-2" width="32" height="4" rx="1" fill="#78716c" />
            <rect x="-2" y="-16" width="4" height="32" rx="1" fill="#78716c" transform="rotate(45)" />
            <rect x="-2" y="-16" width="4" height="32" rx="1" fill="#78716c" transform="rotate(-45)" />
            {/* Center drive hole */}
            <circle cx="0" cy="0" r="7" fill="#1c1917" stroke="#44403c" strokeWidth="1.2" />
          </g>
        </g>

        {/* Bottom Trapezoid Head Shield Plate */}
        <polygon points="90,172 270,172 250,192 110,192" fill="#a8a29e" stroke="#57534e" strokeWidth="1" />
        <circle cx="120" cy="182" r="3.5" fill="#292524" />
        <circle cx="240" cy="182" r="3.5" fill="#292524" />
        <rect x="160" y="176" width="40" height="12" rx="2" fill="#44403c" />
      </svg>

      <style>{`
        @keyframes spinReel {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
