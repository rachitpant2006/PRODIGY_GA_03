import React from 'react';
import { Sliders, Gauge, Flame, FileText, Zap } from 'lucide-react';
import { TokenMode } from '../types';

interface ModelControlsProps {
  mode: TokenMode;
  onModeChange: (mode: TokenMode) => void;
  order: number;
  onOrderChange: (order: number) => void;
  length: number;
  onLengthChange: (length: number) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  seedText: string;
  onSeedTextChange: (seed: string) => void;
  uniqueStatesCount: number;
}

export const ModelControls: React.FC<ModelControlsProps> = ({
  mode,
  onModeChange,
  order,
  onOrderChange,
  length,
  onLengthChange,
  temperature,
  onTemperatureChange,
  seedText,
  onSeedTextChange,
  uniqueStatesCount,
}) => {
  return (
    <div className="bg-slate-900/80 rounded-2xl border border-indigo-950/60 p-4 sm:p-5 shadow-xl backdrop-blur-sm flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-100">2. Markov Parameters</h2>
            <p className="text-xs text-slate-400">Order, tokenization mode, and probabilistic temperature</p>
          </div>
        </div>
        <div className="text-xs font-mono text-purple-400 bg-purple-950/50 px-2.5 py-1 rounded-md border border-purple-800/50">
          {uniqueStatesCount} States
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Token Mode (Word vs Char) */}
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Tokenization Unit
            </span>
            <span className="text-[11px] text-slate-400">
              {mode === 'word' ? 'Whole Words' : 'Characters & Symbols'}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              id="mode-word"
              type="button"
              onClick={() => onModeChange('word')}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                mode === 'word'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Word-level
            </button>
            <button
              id="mode-char"
              type="button"
              onClick={() => onModeChange('char')}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                mode === 'char'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Char-level
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {mode === 'word'
              ? 'Predicts the next word based on previous N words (more coherent sentences).'
              : 'Predicts the next letter or punctuation based on previous N characters.'}
          </p>
        </div>

        {/* Markov Order N */}
        <div>
          <label className="text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" /> Markov Order (N-Gram History)
            </span>
            <span className="text-xs font-mono font-bold text-indigo-400">
              Order {order} ({order === 1 ? '1 token' : `${order} tokens`})
            </span>
          </label>
          <div className="grid grid-cols-4 gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                id={`order-btn-${n}`}
                type="button"
                onClick={() => onOrderChange(n)}
                className={`py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                  order === n
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                N = {n}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {order === 1 && 'Order 1 (Unigram): Memoryless. Often nonsensical but very creative.'}
            {order === 2 && 'Order 2 (Bigram): Balanced. Realistic transitions with good variety.'}
            {order === 3 && 'Order 3 (Trigram): High coherence. Follows grammar closely.'}
            {order === 4 && 'Order 4 (4-gram): Near-exact phrases from the training corpus.'}
          </p>
        </div>

        {/* Output Length Slider */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> Generation Length
            </span>
            <span className="font-mono text-indigo-400 font-bold">
              {length} {mode === 'word' ? 'words' : 'chars'}
            </span>
          </div>
          <input
            id="length-slider"
            type="range"
            min={mode === 'word' ? 20 : 60}
            max={mode === 'word' ? 350 : 1000}
            step={mode === 'word' ? 10 : 20}
            value={length}
            onChange={(e) => onLengthChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>{mode === 'word' ? '20 words' : '60 chars'}</span>
            <span>{mode === 'word' ? '350 words' : '1000 chars'}</span>
          </div>
        </div>

        {/* Temperature / Softmax Randomness */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Sampling Temperature
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {temperature.toFixed(2)} ({temperature < 0.6 ? 'Predictable' : temperature > 1.3 ? 'Creative' : 'Balanced'})
            </span>
          </div>
          <input
            id="temperature-slider"
            type="range"
            min="0.1"
            max="2.0"
            step="0.05"
            value={temperature}
            onChange={(e) => onTemperatureChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>0.1 (Greedy / Top)</span>
            <span>1.0 (Exact Prob)</span>
            <span>2.0 (High Chaos)</span>
          </div>
        </div>
      </div>

      {/* Optional Seed Text */}
      <div className="pt-2 border-t border-slate-800/80">
        <label htmlFor="seed-input" className="text-xs font-medium text-slate-300 block mb-1">
          Starting Seed Phrase <span className="text-slate-500 font-normal">(Optional prompt to begin sequence)</span>
        </label>
        <input
          id="seed-input"
          type="text"
          value={seedText}
          onChange={(e) => onSeedTextChange(e.target.value)}
          placeholder={mode === 'word' ? 'e.g. Alice was, Once upon, To be or' : 'e.g. Ali, Twinkle, The'}
          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
        />
      </div>
    </div>
  );
};
