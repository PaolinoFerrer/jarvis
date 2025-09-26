import React from 'react';
import { ShieldIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-700">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center gap-4">
          <ShieldIcon className="h-8 w-8 text-cyan-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Segretario Vocale DVR
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Dettatura e strutturazione per la Valutazione dei Rischi (D.Lgs. 81/2008)
        </p>
      </div>
    </header>
  );
};