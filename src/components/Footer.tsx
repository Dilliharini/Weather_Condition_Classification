import type { View } from '@/types/navigation';

interface FooterProps {
  onNavigate: (view: View) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-slate-950">
      <div className="container-app py-10">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-400">
            Weather Condition Classification — Deep Learning &amp; Computer Vision
          </p>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
            <button onClick={() => onNavigate('predict')} className="hover:text-white">
              Predict
            </button>
            <button onClick={() => onNavigate('model')} className="hover:text-white">
              Model Info
            </button>
            <button onClick={() => onNavigate('results')} className="hover:text-white">
              Results
            </button>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-slate-600">
          Portfolio project — model training in progress. No results are fabricated.
        </p>
      </div>
    </footer>
  );
}
