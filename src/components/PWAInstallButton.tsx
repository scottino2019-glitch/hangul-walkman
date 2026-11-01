import React, { useState } from 'react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { Download, Share2, WifiOff, CheckCircle2 } from 'lucide-react';
import { soundFx } from '../utils/audioEffects';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleInstallClick = () => {
    soundFx.playClick('switch');
    install();
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/60 border border-emerald-600/40 text-[11px] font-mono text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>PWA INSTALLATA</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        title="Installa HanziWalk sulla schermata home"
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 active:translate-y-0.5 text-neutral-950 font-bold text-xs tracking-wider uppercase shadow-md transition border border-amber-300 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Installa App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => {
            soundFx.playClick('switch');
            setShowIOSGuide(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-xs text-neutral-200 cursor-pointer"
        >
          <Share2 className="w-3 h-3 text-amber-400" />
          <span>Installa su iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white border-2 border-stone-300 p-6 shadow-2xl text-stone-800">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <h3 className="text-base font-bold text-amber-700 font-mono tracking-wide">
                  INSTALLA SU IPHONE / IPAD
                </h3>
                <span className="text-xs bg-stone-100 border border-stone-300 px-2 py-0.5 rounded text-stone-600 font-mono">PWA</span>
              </div>
              <div className="mt-4 space-y-3 text-sm text-stone-700 font-sans">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <p>
                    Tocca l&apos;icona <strong className="text-stone-900">Condividi</strong> (<Share2 className="w-3.5 h-3.5 inline text-blue-600" />) nella barra inferiore di Safari.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <p>
                    Scorri verso il basso e seleziona <strong className="text-stone-900">&quot;Aggiungi alla schermata Home&quot;</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <p>
                    Conferma con <strong>Aggiungi</strong> in alto a destra per aprire il lettore come app nativa a schermo intero!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundFx.playClick('switch');
                  setShowIOSGuide(false);
                }}
                className="mt-6 w-full rounded-xl bg-stone-100 hover:bg-stone-200 py-2.5 text-sm font-semibold text-stone-800 border border-stone-300 transition cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-red-600/90 backdrop-blur-xs px-3.5 py-2 text-xs font-mono text-white shadow-xl border border-red-400/50">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>MODALITÀ OFFLINE ATTIVA — Cache audio abilitata</span>
    </div>
  );
};
