import { useState } from 'react';
import { CloudSun, Menu, X } from 'lucide-react';
import type { View } from '@/types/navigation';

interface NavbarProps {
  current: View;
  onNavigate: (view: View) => void;
}

const LINKS: { id: View; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'predict', label: 'Predict' },
  { id: 'model', label: 'Model Info' },
  { id: 'results', label: 'Results' },
  { id: 'explain', label: 'Explainable AI' },
];

export function Navbar({ current, onNavigate }: NavbarProps) {
  const [open, setOpen] = useState(false);

  const handleNavigate = (view: View) => {
    onNavigate(view);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <nav className="container-app flex h-16 items-center justify-between">
        <button
          onClick={() => handleNavigate('home')}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg"
        >
          <CloudSun className="h-7 w-7 text-sky-400" aria-hidden="true" />
          <span className="text-base font-semibold tracking-tight text-white">
            Weather Classification
          </span>
        </button>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => handleNavigate(link.id)}
                className={`nav-link ${current === link.id ? 'nav-link-active' : ''}`}
                aria-current={current === link.id ? 'page' : undefined}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-slate-800 bg-slate-950/95 md:hidden">
          <ul className="container-app flex flex-col gap-1 py-3">
            {LINKS.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => handleNavigate(link.id)}
                  className={`nav-link w-full text-left ${current === link.id ? 'nav-link-active' : ''}`}
                  aria-current={current === link.id ? 'page' : undefined}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
