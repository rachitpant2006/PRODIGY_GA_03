import React, { useState, useMemo } from 'react';
import { Search, Layers, ArrowRight, BarChart2, Filter, GitFork, CheckCircle2 } from 'lucide-react';
import { MarkovModel, TokenMode } from '../types';
import { formatStateKey, getStateTransitions } from '../utils/markov';

interface TransitionInspectorProps {
  model: MarkovModel;
  mode: TokenMode;
  order: number;
}

export const TransitionInspector: React.FC<TransitionInspectorProps> = ({ model, mode, order }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStateKey, setSelectedStateKey] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'branching' | 'frequent'>('all');

  // Compute all states sorted by occurrence count
  const allStatesList = useMemo(() => {
    const list: { key: string; display: string; totalOccurrences: number; branchCount: number }[] = [];

    model.transitions.forEach((nextMap, stateKey) => {
      let total = 0;
      nextMap.forEach((count) => {
        total += count;
      });

      list.push({
        key: stateKey,
        display: formatStateKey(stateKey, mode),
        totalOccurrences: total,
        branchCount: nextMap.size,
      });
    });

    // Default sort by occurrence count descending
    list.sort((a, b) => b.totalOccurrences - a.totalOccurrences);
    return list;
  }, [model, mode]);

  // Filtered states based on search & filter tabs
  const filteredStates = useMemo(() => {
    return allStatesList.filter((item) => {
      // Search check
      if (searchQuery.trim().length > 0) {
        if (!item.display.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      // Mode filter
      if (filterMode === 'branching') {
        return item.branchCount > 1;
      }
      if (filterMode === 'frequent') {
        return item.totalOccurrences >= 3;
      }

      return true;
    });
  }, [allStatesList, searchQuery, filterMode]);

  // Set default selected state if none selected or invalid
  const activeState = selectedStateKey || (filteredStates.length > 0 ? filteredStates[0].key : null);

  // Transitions for the active state
  const activeTransitions = useMemo(() => {
    if (!activeState) return null;
    return getStateTransitions(model, activeState);
  }, [model, activeState]);

  // Model summary statistics
  const avgBranchingFactor = useMemo(() => {
    if (allStatesList.length === 0) return 0;
    const totalBranches = allStatesList.reduce((acc, curr) => acc + curr.branchCount, 0);
    return (totalBranches / allStatesList.length).toFixed(2);
  }, [allStatesList]);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-indigo-950/60 p-4 sm:p-6 shadow-xl backdrop-blur-sm flex flex-col gap-5">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">Transition Probability Matrix</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore state transitions and conditional probabilities: <code className="text-indigo-400 font-mono">P(Token | State)</code>
          </p>
        </div>

        {/* Aggregate Stats Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400">Total States:</span>{' '}
            <strong className="text-slate-200 font-mono">{allStatesList.length.toLocaleString()}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-400">Avg Branching:</span>{' '}
            <strong className="text-indigo-400 font-mono">{avgBranchingFactor}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: State Directory + State Probability Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[420px]">
        {/* Left Column: States List with Search & Filters (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-slate-950/80 rounded-xl border border-slate-800 p-3.5">
          {/* Search bar */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${allStatesList.length} states...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 mb-2.5 pb-2 border-b border-slate-800 text-[11px]">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filterMode === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({allStatesList.length})
            </button>
            <button
              onClick={() => setFilterMode('branching')}
              className={`px-2 py-0.5 rounded-md transition-colors flex items-center gap-1 ${
                filterMode === 'branching' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitFork className="w-3 h-3" /> Multi-branch
            </button>
            <button
              onClick={() => setFilterMode('frequent')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                filterMode === 'frequent' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Freq ≥ 3
            </button>
          </div>

          {/* States Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-1 max-h-[360px] pr-1">
            {filteredStates.length > 0 ? (
              filteredStates.map((stateItem) => {
                const isSelected = activeState === stateItem.key;
                return (
                  <button
                    key={stateItem.key}
                    onClick={() => setSelectedStateKey(stateItem.key)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="truncate font-mono pr-2">
                      <span className="text-slate-400 text-[10px] mr-1.5 font-sans">State:</span>
                      "{stateItem.display}"
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 flex-shrink-0">
                      <span>{stateItem.totalOccurrences}x</span>
                      {stateItem.branchCount > 1 && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800">
                          {stateItem.branchCount} br
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs">
                No matching states found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected State Probability Distribution & Transition Graph (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950/80 rounded-xl border border-slate-800 p-4 sm:p-5 justify-between">
          {activeTransitions ? (
            <div>
              {/* Selected State Header */}
              <div className="pb-3 mb-4 border-b border-slate-800/90">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                  Selected State Condition (Order {order} N-Gram)
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-base sm:text-lg font-mono font-bold text-indigo-300 bg-indigo-950/60 px-3 py-1 rounded-lg border border-indigo-800/80">
                    "{formatStateKey(activeTransitions.state, mode)}"
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Observed <strong className="text-slate-200">{activeTransitions.totalOccurrences}</strong> time
                    {activeTransitions.totalOccurrences === 1 ? '' : 's'} in corpus
                  </div>
                </div>
              </div>

              {/* Conditional Probability Breakdown */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-indigo-400" /> Outgoing Transition Probabilities
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {activeTransitions.nextTokens.length} Target Token{activeTransitions.nextTokens.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {activeTransitions.nextTokens.map((opt, idx) => {
                    const percentage = (opt.probability * 100).toFixed(1);
                    return (
                      <div
                        key={`${opt.token}-${idx}`}
                        className="bg-slate-900/90 rounded-xl border border-slate-800/90 p-2.5 relative overflow-hidden"
                      >
                        {/* Progress Bar Backing */}
                        <div
                          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 pointer-events-none"
                          style={{ width: `${percentage}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                            <ArrowRight className="w-3 h-3 text-indigo-400" />
                            <span className="font-mono font-bold text-slate-100">
                              "{opt.token === '\n' ? '\\n' : opt.token}"
                            </span>
                          </div>

                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-slate-400 text-[11px]">
                              {opt.count} / {activeTransitions.totalOccurrences}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mathematical Equation Representation */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
                <div className="text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Markov Conditional Probability:
                </div>
                <div>
                  P("{activeTransitions.nextTokens[0]?.token}" | "{formatStateKey(activeTransitions.state, mode)}") ={' '}
                  <span className="text-indigo-300 font-bold">
                    {(activeTransitions.nextTokens[0]?.probability).toFixed(3)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 my-auto">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">Select a state from the left</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Click any state in the directory to inspect its exact outgoing transition distribution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
