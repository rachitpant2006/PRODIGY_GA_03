import React, { useRef } from 'react';
import { BookMarked, Upload, Trash2, Hash, Type, Database, Sparkles } from 'lucide-react';
import { PresetCorpus, TokenMode } from '../types';
import { PRESET_CORPUSES } from '../data/presets';

interface CorpusEditorProps {
  corpusText: string;
  onCorpusChange: (text: string) => void;
  selectedPresetId: string;
  onSelectPreset: (preset: PresetCorpus) => void;
  totalTokens: number;
  vocabSize: number;
  mode: TokenMode;
}

export const CorpusEditor: React.FC<CorpusEditorProps> = ({
  corpusText,
  onCorpusChange,
  selectedPresetId,
  onSelectPreset,
  totalTokens,
  vocabSize,
  mode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onCorpusChange(content);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-indigo-950/60 p-4 sm:p-5 shadow-xl flex flex-col h-full backdrop-blur-sm">
      {/* Title & Presets Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookMarked className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-100">1. Training Corpus</h2>
            <p className="text-xs text-slate-400">The source text used to calculate transition probabilities</p>
          </div>
        </div>

        {/* Action buttons: Upload, Clear */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.json,.csv"
            className="hidden"
            id="file-upload-input"
          />
          <button
            id="btn-upload-file"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            title="Upload custom .txt file"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Upload</span> File
          </button>
          <button
            id="btn-clear-corpus"
            onClick={() => onCorpusChange('')}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/50 hover:text-red-300 text-slate-400 border border-slate-700/60 transition-colors"
            title="Clear text"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="py-3">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Choose Preset Corpus:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_CORPUSES.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-${preset.id}`}
                onClick={() => onSelectPreset(preset)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-medium shadow-sm'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {preset.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Corpus Textarea */}
      <div className="relative flex-1 min-h-[160px] sm:min-h-[200px] mb-3">
        <textarea
          id="corpus-textarea"
          value={corpusText}
          onChange={(e) => onCorpusChange(e.target.value)}
          placeholder="Paste or type training text here... The Markov chain will break it down into n-grams and compute transition probabilities."
          className="w-full h-full p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 placeholder-slate-500 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        />
        {corpusText.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <Database className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-400">Training corpus is empty</p>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Select one of the sample presets above or type/paste your own text to train the Markov model.
            </p>
          </div>
        )}
      </div>

      {/* Real-time Corpus Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 px-2">
          <Hash className="w-3.5 h-3.5 text-indigo-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Total {mode === 'word' ? 'Words' : 'Chars'}</div>
            <div className="font-semibold text-slate-200 font-mono">{totalTokens.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 border-l border-slate-800">
          <Type className="w-3.5 h-3.5 text-purple-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Unique Vocab</div>
            <div className="font-semibold text-slate-200 font-mono">{vocabSize.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-2 border-l border-slate-800">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-medium">Characters</div>
            <div className="font-semibold text-slate-200 font-mono">{corpusText.length.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
