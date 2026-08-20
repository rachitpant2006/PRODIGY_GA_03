import React from 'react';
import { Sparkles, BookOpen, Layers, RefreshCw, Cpu } from 'lucide-react';

interface HeaderProps {
  activeTab: 'generate' | 'inspector' | 'guide';
  onTabChange: (tab: 'generate' | 'inspector' | 'guide') => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onReset }) => {
  return (
    <header className="border-b border-indigo-900/40 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Task Identifier */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg ring-1 ring-white/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                Task-03
              </span>
              <span className="text-xs text-slate-400 font-mono">Statistical NLP</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-1.5 tracking-tight">
              Markov Chain <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Text Generator</span>
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-center">
          <button
            id="tab-generate"
            onClick={() => onTabChange('generate')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'generate'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generator</span>
          </button>

          <button
            id="tab-inspector"
            onClick={() => onTabChange('inspector')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'inspector'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>State Matrix</span>
          </button>

          <button
            id="tab-guide"
            onClick={() => onTabChange('guide')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'guide'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Algorithm Guide</span>
          </button>
        </div>

        {/* Global Reset */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            id="btn-global-reset"
            onClick={onReset}
            title="Reset training corpus and model"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
