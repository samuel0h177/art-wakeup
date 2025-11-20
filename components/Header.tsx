import React from 'react';
import { Palette } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-8 flex items-center justify-between border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-rose-500 rounded-lg text-white shadow-lg shadow-rose-200">
          <Palette size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight serif">Masterpiece Motion</h1>
          <p className="text-xs text-stone-500 font-medium tracking-wider uppercase">Powered by Veo</p>
        </div>
      </div>
      <nav>
        <a href="https://ai.google.dev/gemini-api/docs/models/veo" target="_blank" rel="noreferrer" className="text-sm font-medium text-stone-500 hover:text-rose-600 transition-colors">
          Documentation
        </a>
      </nav>
    </header>
  );
};