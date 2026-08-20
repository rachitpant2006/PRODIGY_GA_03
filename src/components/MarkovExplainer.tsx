import React from 'react';
import { BookOpen, Cpu, Lightbulb, GitCommit, Binary, Sparkles, CheckCircle2 } from 'lucide-react';

export const MarkovExplainer: React.FC = () => {
  return (
    <div className="bg-slate-900/80 rounded-2xl border border-indigo-950/60 p-5 sm:p-7 shadow-xl backdrop-blur-sm flex flex-col gap-6 text-slate-200">
      {/* Title & Badge */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Task-03 Theoretical Guide
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          How Markov Chains Generate Natural Text
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Understanding the statistical mechanism behind transition matrices, N-gram state memory, and probabilistic token sampling.
        </p>
      </div>

      {/* 3-Step Process Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center font-mono font-bold text-sm">
            01
          </div>
          <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
            <Binary className="w-4 h-4 text-indigo-400" /> Tokenization & States
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The input corpus is sliced into tokens (either full words or characters). We group N consecutive tokens into an N-gram state key: S<sub>t</sub> = (w<sub>t-N+1</sub>, ..., w<sub>t</sub>).
          </p>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center font-mono font-bold text-sm">
            02
          </div>
          <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
            <GitCommit className="w-4 h-4 text-purple-400" /> Frequency Counting
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            For each state S<sub>t</sub>, we count every time a candidate token w<sub>t+1</sub> follows it across the entire text corpus to compute empirical transition probabilities:
          </p>
          <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-purple-300">
            P(w | S) = Count(S, w) / Count(S)
          </div>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-pink-950 text-pink-400 border border-pink-800 flex items-center justify-center font-mono font-bold text-sm">
            03
          </div>
          <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" /> Probabilistic Generation
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Starting with an initial state, we sample the next token according to the probability distribution (or weighted with temperature), slide our window forward by one step, and repeat.
          </p>
        </div>
      </div>

      {/* Visual Markov Property & Order Explanation */}
      <div className="bg-slate-950/90 rounded-xl border border-indigo-950 p-4 sm:p-5 flex flex-col gap-4">
        <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" /> The Markov Property & N-Gram Memory
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          A Markov chain follows the <em>Markov Property</em>: the conditional probability distribution of the next state depends <strong>only on the present state</strong>, and not on the sequence of events that preceded it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="font-mono font-bold text-indigo-400 mb-1">Order 1 (N = 1)</div>
            <div className="text-slate-400 text-[11px]">
              Looks back 1 token. High variety and spontaneous nonsense. Often grammatical chaos.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-indigo-800/60 bg-indigo-950/20">
            <div className="font-mono font-bold text-indigo-300 mb-1">Order 2 (N = 2) ★</div>
            <div className="text-slate-300 text-[11px]">
              Looks back 2 tokens (bigrams). The sweet spot for balance between creativity and readable phrasing.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="font-mono font-bold text-purple-400 mb-1">Order 3 (N = 3)</div>
            <div className="text-slate-400 text-[11px]">
              Looks back 3 tokens. Sentences become highly coherent with authentic grammatical flow.
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="font-mono font-bold text-pink-400 mb-1">Order 4 (N = 4)</div>
            <div className="text-slate-400 text-[11px]">
              High fidelity. Generates verbatim sentences from the source with minimal variation.
            </div>
          </div>
        </div>
      </div>

      {/* Comparison: Word-level vs Character-level */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <h4 className="text-xs sm:text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" /> Word-level Generation
          </h4>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Tokens are entire words (e.g. <code className="text-slate-300">"rabbit"</code>, <code className="text-slate-300">"hole"</code>)</li>
            <li>Produces real dictionary words guaranteed</li>
            <li>Requires a moderate corpus size to find common transition paths</li>
            <li>Best for story generation, fake dialogue, and commit messages</li>
          </ul>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <h4 className="text-xs sm:text-sm font-semibold text-purple-300 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-purple-400" /> Character-level Generation
          </h4>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Tokens are individual letters and symbols (e.g. <code className="text-slate-300">'a'</code>, <code className="text-slate-300">'b'</code>)</li>
            <li>Model learns phonetic prefixes, suffixes, and word boundaries from scratch</li>
            <li>Can invent whimsical new words or rhyme patterns</li>
            <li>Works great with higher order $N=3$ or $N=4$ on poems and rhymes</li>
          </ul>
        </div>
      </div>

      {/* Historical Context / Pro Tip */}
      <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-start gap-3 text-xs text-indigo-200">
        <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Historical Note:</strong> Andrey Markov invented Markov chains in 1906 to study vowel-consonant letter patterns in Alexander Pushkin’s novel in verse <em>Eugene Onegin</em>. Today, n-gram Markov chains remain the foundational conceptual ancestor to modern autoregressive language modeling!
        </div>
      </div>
    </div>
  );
};
