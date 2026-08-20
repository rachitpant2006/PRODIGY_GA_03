import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  Download,
  FastForward,
  Info,
  ChevronRight,
  Dice5,
} from 'lucide-react';
import { MarkovModel, NextTokenOption, TokenMode } from '../types';
import {
  generateText,
  getStateTransitions,
  sampleNextToken,
  stateToKey,
  keyToTokens,
  formatStateKey,
  detokenize,
  tokenizeText,
} from '../utils/markov';

interface TextGeneratorViewProps {
  model: MarkovModel;
  mode: TokenMode;
  order: number;
  length: number;
  temperature: number;
  seedText: string;
}

export const TextGeneratorView: React.FC<TextGeneratorViewProps> = ({
  model,
  mode,
  order,
  length,
  temperature,
  seedText,
}) => {
  // Output states
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [tokensCount, setTokensCount] = useState<number>(0);
  const [stoppedReason, setStoppedReason] = useState<string>('');

  // Step-by-Step Interactive Generation State
  const [isInteractiveMode, setIsInteractiveMode] = useState<boolean>(false);
  const [stepTokens, setStepTokens] = useState<string[]>([]);
  const [currentStateTokens, setCurrentStateTokens] = useState<string[]>([]);
  const [currentCandidateOptions, setCurrentCandidateOptions] = useState<NextTokenOption[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(350); // ms per step
  const [lastChosenToken, setLastChosenToken] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const outputContainerRef = useRef<HTMLDivElement>(null);

  // Perform full instant generation
  const handleInstantGenerate = useCallback(() => {
    if (model.transitions.size === 0) {
      setGeneratedText('Model is empty. Please provide text in the Training Corpus.');
      setTokensCount(0);
      return;
    }

    const result = generateText(model, {
      maxLength: length,
      temperature,
      customSeed: seedText,
    });

    setGeneratedText(result.text);
    setTokensCount(result.tokensGenerated);
    setStoppedReason(
      result.stoppedReason === 'dead_end'
        ? 'Reached a state with no known outgoing transitions.'
        : `Completed target length of ${length} tokens.`
    );
  }, [model, length, temperature, seedText]);

  // Trigger generation initially when model has data and generatedText is empty
  useEffect(() => {
    if (model.transitions.size > 0 && !generatedText && !isInteractiveMode) {
      handleInstantGenerate();
    }
  }, [model, handleInstantGenerate, generatedText, isInteractiveMode]);

  // Copy to clipboard handler
  const handleCopy = () => {
    const textToCopy = isInteractiveMode ? detokenize(stepTokens, mode) : generatedText;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Export as .txt
  const handleDownload = () => {
    const textToDownload = isInteractiveMode ? detokenize(stepTokens, mode) : generatedText;
    if (!textToDownload) return;

    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `markov-generated-${mode}-order${order}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Initialize interactive step-by-step state
  const resetInteractiveState = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (model.transitions.size === 0) {
      setStepTokens([]);
      setCurrentStateTokens([]);
      setCurrentCandidateOptions([]);
      return;
    }

    let initialTokens: string[] = [];

    if (seedText && seedText.trim().length > 0) {
      const seedToks = tokenizeText(seedText, mode);
      if (seedToks.length >= order) {
        initialTokens = seedToks.slice(seedToks.length - order);
      } else {
        const matching = model.startStates.find((st) =>
          formatStateKey(st, mode).toLowerCase().startsWith(seedText.toLowerCase())
        );
        if (matching) {
          initialTokens = keyToTokens(matching, mode);
        } else {
          const randomStart = model.startStates[Math.floor(Math.random() * model.startStates.length)];
          initialTokens = keyToTokens(randomStart, mode);
        }
      }
    } else {
      const randomStart = model.startStates[Math.floor(Math.random() * model.startStates.length)];
      initialTokens = keyToTokens(randomStart, mode);
    }

    setStepTokens([...initialTokens]);
    setCurrentStateTokens([...initialTokens]);

    const stateKey = stateToKey(initialTokens, mode);
    const trans = getStateTransitions(model, stateKey);
    setCurrentCandidateOptions(trans ? trans.nextTokens : []);
    setLastChosenToken(null);
  }, [model, mode, order, seedText]);

  // Switch between instant mode and interactive mode
  const toggleInteractiveMode = (enabled: boolean) => {
    setIsInteractiveMode(enabled);
    if (enabled) {
      resetInteractiveState();
    }
  };

  // Perform single step transition
  const executeStep = useCallback((forcedToken?: string) => {
    if (currentCandidateOptions.length === 0) {
      setIsPlaying(false);
      return;
    }

    let nextToken = '';
    if (forcedToken) {
      nextToken = forcedToken;
    } else {
      const sampled = sampleNextToken(currentCandidateOptions, temperature);
      nextToken = sampled.token;
    }

    setLastChosenToken(nextToken);

    setStepTokens((prev) => {
      const updatedTokens = [...prev, nextToken];
      return updatedTokens;
    });

    const newWindow = [...currentStateTokens.slice(1), nextToken];
    setCurrentStateTokens(newWindow);

    const newStateKey = stateToKey(newWindow, mode);
    const trans = getStateTransitions(model, newStateKey);

    if (!trans || trans.nextTokens.length === 0) {
      setCurrentCandidateOptions([]);
      setIsPlaying(false);
    } else {
      setCurrentCandidateOptions(trans.nextTokens);
    }

    // Scroll to bottom
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [currentCandidateOptions, currentStateTokens, mode, model, temperature]);

  // Handle auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        executeStep();
      }, playSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playSpeed, executeStep]);

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-indigo-950/60 p-4 sm:p-5 shadow-xl backdrop-blur-sm flex flex-col h-full">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-100">3. Generated Output</h2>
            <p className="text-xs text-slate-400">
              {isInteractiveMode
                ? 'Step-by-step token selection with real-time transition branch inspector'
                : 'Instant stochastic Markov text stream'}
            </p>
          </div>
        </div>

        {/* Mode Switch: Instant vs Step-by-Step */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            id="tab-mode-instant"
            type="button"
            onClick={() => toggleInteractiveMode(false)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              !isInteractiveMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Instant Stream
          </button>
          <button
            id="tab-mode-step"
            type="button"
            onClick={() => toggleInteractiveMode(true)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              isInteractiveMode
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Step-by-Step
          </button>
        </div>
      </div>

      {/* Main Output Content Container */}
      {!isInteractiveMode ? (
        /* Instant Output View */
        <div className="flex flex-col flex-1 mt-3">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <button
              id="btn-generate-instant"
              onClick={handleInstantGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
            >
              <Dice5 className="w-4 h-4" />
              <span>Generate Sample</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                id="btn-copy-text"
                onClick={handleCopy}
                disabled={!generatedText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
                title="Copy generated text"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                id="btn-download-text"
                onClick={handleDownload}
                disabled={!generatedText}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-medium transition-colors"
                title="Download as .txt"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Generated Text Box */}
          <div
            ref={outputContainerRef}
            className="flex-1 min-h-[220px] p-4 rounded-xl bg-slate-950/90 border border-slate-800/90 text-slate-100 font-serif sm:text-base leading-relaxed overflow-y-auto whitespace-pre-wrap select-text shadow-inner"
          >
            {generatedText ? (
              <span className="tracking-wide">{generatedText}</span>
            ) : (
              <span className="text-slate-500 italic text-sm font-sans">
                Click "Generate Sample" above to generate text using the Markov model.
              </span>
            )}
          </div>

          {/* Status footer */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 px-1 font-mono">
            <span>
              Generated <strong className="text-slate-200">{tokensCount}</strong> {mode === 'word' ? 'words' : 'characters'}
            </span>
            {stoppedReason && (
              <span className="text-slate-500 truncate max-w-xs sm:max-w-md">{stoppedReason}</span>
            )}
          </div>
        </div>
      ) : (
        /* Interactive Step-by-Step Visualizer View */
        <div className="flex flex-col flex-1 mt-3 gap-3">
          {/* Interactive Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                id="btn-play-pause"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={currentCandidateOptions.length === 0}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                  isPlaying
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                } disabled:opacity-50`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
              </button>

              <button
                id="btn-step-next"
                onClick={() => executeStep()}
                disabled={isPlaying || currentCandidateOptions.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
                title="Sample 1 token according to probability"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>Step 1 Token</span>
              </button>

              <button
                id="btn-step-restart"
                onClick={resetInteractiveState}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
                title="Restart sequence"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Speed selection */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">Speed:</span>
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                {[
                  { label: '0.5x', speed: 600 },
                  { label: '1x', speed: 350 },
                  { label: '2x', speed: 150 },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setPlaySpeed(s.speed)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      playSpeed === s.speed
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs ml-1"
                title="Copy current sequence"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Current State & Next Token Candidate Probabilities */}
          <div className="bg-slate-950/90 rounded-xl border border-indigo-950 p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  Current State <code className="text-indigo-400 font-mono font-normal">S_t</code>:
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-950/80 border border-indigo-800/80 text-indigo-200 font-mono text-xs font-semibold">
                  "{currentStateTokens.map((t) => (t === '\n' ? '\\n' : t)).join(mode === 'word' ? ' ' : '')}"
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {currentCandidateOptions.length} Possible Transition{currentCandidateOptions.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Candidate distribution buttons */}
            {currentCandidateOptions.length > 0 ? (
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {currentCandidateOptions.map((option, idx) => {
                  const percent = (option.probability * 100).toFixed(1);
                  const isTop = idx === 0;
                  const isRecentlyChosen = lastChosenToken === option.token;

                  return (
                    <button
                      key={`${option.token}-${idx}`}
                      onClick={() => executeStep(option.token)}
                      disabled={isPlaying}
                      className={`w-full group text-left relative overflow-hidden rounded-lg border p-2 text-xs transition-all ${
                        isRecentlyChosen
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : isTop
                          ? 'border-indigo-800/80 bg-slate-900/90 hover:border-indigo-600'
                          : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      {/* Probability percentage background fill bar */}
                      <div
                        className={`absolute top-0 bottom-0 left-0 opacity-20 pointer-events-none transition-all ${
                          isTop ? 'bg-indigo-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />

                      <div className="relative flex items-center justify-between z-10">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 text-[10px]">#{idx + 1}</span>
                          <span className="font-mono font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            "{option.token === '\n' ? '\\n' : option.token}"
                          </span>
                          {isRecentlyChosen && (
                            <span className="text-[10px] text-emerald-400 font-sans font-medium px-1.5 py-0.2 bg-emerald-950/80 rounded border border-emerald-800">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-slate-400">({option.count}x)</span>
                          <span className="font-bold text-indigo-400">{percent}%</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 bg-amber-950/20 border border-amber-900/50 rounded-lg text-amber-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Absorbing State: No outgoing transitions from this state in the corpus. Click Restart to try another seed.</span>
              </div>
            )}
          </div>

          {/* Interactive Accumulated Text Container */}
          <div
            ref={outputContainerRef}
            className="flex-1 min-h-[140px] p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-100 font-serif sm:text-base leading-relaxed overflow-y-auto shadow-inner"
          >
            {stepTokens.map((token, index) => {
              const isRecent = index === stepTokens.length - 1;
              const isCurrentWindow = index >= stepTokens.length - order;

              return (
                <span
                  key={index}
                  className={`transition-colors duration-300 inline ${
                    isRecent
                      ? 'bg-emerald-500/20 text-emerald-200 rounded px-1'
                      : isCurrentWindow
                      ? 'bg-indigo-950/50 text-indigo-200'
                      : 'text-slate-200'
                  }`}
                >
                  {mode === 'word' && index > 0 && token !== '\n' ? ' ' : ''}
                  {token === '\n' ? <br /> : token}
                </span>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between px-1">
            <span>
              Sequence Length: <strong className="text-slate-300">{stepTokens.length}</strong> tokens
            </span>
            <span>Tip: Click any candidate above to branch manually!</span>
          </div>
        </div>
      )}
    </div>
  );
};
