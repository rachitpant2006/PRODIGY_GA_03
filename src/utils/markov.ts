import { MarkovModel, ModelStats, NextTokenOption, StateTransitions, TokenMode } from '../types';

/**
 * Tokenize text into an array of tokens depending on the chosen mode.
 */
export function tokenizeText(text: string, mode: TokenMode): string[] {
  if (!text || text.trim().length === 0) return [];

  if (mode === 'char') {
    return Array.from(text);
  }

  // Word tokenization: Split by whitespace, keeping words and major punctuation
  // Matches words, punctuation marks, or newlines
  const regex = /\r\n|\r|\n|\S+/g;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0]);
  }

  return tokens;
}

/**
 * Reassemble tokens into readable text
 */
export function detokenize(tokens: string[], mode: TokenMode): string {
  if (mode === 'char') {
    return tokens.join('');
  }

  let result = '';
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (i === 0) {
      result += token;
    } else {
      // Check if token is a newline
      if (token === '\n' || token === '\r\n') {
        result += '\n';
      } else if (result.endsWith('\n')) {
        result += token;
      } else {
        result += ' ' + token;
      }
    }
  }
  return result;
}

/**
 * Join an array of n-gram tokens into a single state key
 */
export function stateToKey(state: string[], mode: TokenMode): string {
  if (mode === 'char') {
    return state.join('');
  }
  return state.join('\u241F'); // Use unit separator for reliable word state hashing
}

/**
 * Split a state key back into its constituent token array
 */
export function keyToTokens(key: string, mode: TokenMode): string[] {
  if (mode === 'char') {
    return Array.from(key);
  }
  return key.split('\u241F');
}

/**
 * Format a state key for human-readable display
 */
export function formatStateKey(key: string, mode: TokenMode): string {
  if (mode === 'char') {
    return key.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/ /g, '␣');
  }
  return key.split('\u241F').join(' ');
}

/**
 * Build Markov Chain Transition Model
 */
export function buildMarkovModel(corpus: string, order: number, mode: TokenMode): MarkovModel {
  const tokens = tokenizeText(corpus, mode);
  const transitions = new Map<string, Map<string, number>>();
  const startStates: string[] = [];
  const vocabulary = new Set<string>();

  const n = Math.max(1, Math.floor(order));

  if (tokens.length < n) {
    return {
      order: n,
      mode,
      transitions,
      startStates,
      vocabulary,
      totalTokens: tokens.length,
    };
  }

  for (let i = 0; i < tokens.length; i++) {
    vocabulary.add(tokens[i]);
  }

  // Iterate over tokens to build n-gram transitions
  for (let i = 0; i <= tokens.length - n; i++) {
    const stateTokens = tokens.slice(i, i + n);
    const stateKey = stateToKey(stateTokens, mode);

    // Track starting states (either beginning of text, or begins after punctuation / capitalized)
    if (i === 0) {
      startStates.push(stateKey);
    } else if (mode === 'word') {
      const prevToken = tokens[i - 1];
      if (prevToken.endsWith('.') || prevToken.endsWith('!') || prevToken.endsWith('?') || prevToken === '\n') {
        startStates.push(stateKey);
      } else if (/^[A-Z]/.test(stateTokens[0]) && Math.random() < 0.15) {
        startStates.push(stateKey);
      }
    } else if (mode === 'char') {
      if (i > 0 && (tokens[i - 1] === '.' || tokens[i - 1] === '\n') && /[A-Z]/.test(stateTokens[0])) {
        startStates.push(stateKey);
      }
    }

    if (i + n < tokens.length) {
      const nextToken = tokens[i + n];
      let stateMap = transitions.get(stateKey);
      if (!stateMap) {
        stateMap = new Map<string, number>();
        transitions.set(stateKey, stateMap);
      }
      const count = stateMap.get(nextToken) || 0;
      stateMap.set(nextToken, count + 1);
    }
  }

  if (startStates.length === 0 && tokens.length >= n) {
    startStates.push(stateToKey(tokens.slice(0, n), mode));
  }

  return {
    order: n,
    mode,
    transitions,
    startStates,
    vocabulary,
    totalTokens: tokens.length,
  };
}

/**
 * Get transition options and probabilities for a given state key
 */
export function getStateTransitions(model: MarkovModel, stateKey: string): StateTransitions | null {
  const stateMap = model.transitions.get(stateKey);
  if (!stateMap || stateMap.size === 0) {
    return null;
  }

  let totalCount = 0;
  stateMap.forEach((count) => {
    totalCount += count;
  });

  const options: NextTokenOption[] = [];
  stateMap.forEach((count, token) => {
    options.push({
      token,
      count,
      probability: count / totalCount,
    });
  });

  // Sort by probability descending
  options.sort((a, b) => b.probability - a.probability);

  return {
    state: stateKey,
    totalOccurrences: totalCount,
    nextTokens: options,
  };
}

/**
 * Sample the next token from probability distribution with temperature scaling
 * temperature = 1.0 -> standard probability
 * temperature < 1.0 -> more deterministic (higher probability tokens favored)
 * temperature > 1.0 -> more random / creative
 */
export function sampleNextToken(
  options: NextTokenOption[],
  temperature: number = 1.0
): { token: string; chosenProb: number } {
  if (options.length === 0) {
    throw new Error('No transition options available.');
  }
  if (options.length === 1) {
    return { token: options[0].token, chosenProb: options[0].probability };
  }

  // Apply temperature scaling
  const temp = Math.max(0.1, Math.min(2.5, temperature));
  
  if (temp < 0.2) {
    // Greedy top token
    return { token: options[0].token, chosenProb: options[0].probability };
  }

  // Softmax-like temperature sampling
  const scaledWeights: number[] = options.map((opt) => {
    return Math.pow(opt.probability, 1 / temp);
  });

  const totalWeight = scaledWeights.reduce((sum, w) => sum + w, 0);
  const randomVal = Math.random() * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < options.length; i++) {
    cumulative += scaledWeights[i];
    if (randomVal <= cumulative || i === options.length - 1) {
      return { token: options[i].token, chosenProb: options[i].probability };
    }
  }

  return { token: options[0].token, chosenProb: options[0].probability };
}

/**
 * Generate full text sequence using Markov Chain
 */
export function generateText(
  model: MarkovModel,
  options: {
    maxLength: number;
    temperature?: number;
    customSeed?: string;
  }
): { text: string; tokensGenerated: number; stoppedReason: 'length' | 'dead_end' | 'natural_end' } {
  if (model.transitions.size === 0) {
    return { text: '', tokensGenerated: 0, stoppedReason: 'dead_end' };
  }

  const { maxLength, temperature = 1.0, customSeed } = options;

  let currentTokens: string[] = [];

  // Determine starting state
  if (customSeed && customSeed.trim().length > 0) {
    const seedTokens = tokenizeText(customSeed, model.mode);
    if (seedTokens.length >= model.order) {
      currentTokens = seedTokens.slice(seedTokens.length - model.order);
    } else {
      // Find a start state that contains this seed if possible
      const matching = model.startStates.find((st) =>
        formatStateKey(st, model.mode).toLowerCase().startsWith(customSeed.toLowerCase())
      );
      if (matching) {
        currentTokens = keyToTokens(matching, model.mode);
      } else {
        const randomStart = model.startStates[Math.floor(Math.random() * model.startStates.length)];
        currentTokens = keyToTokens(randomStart, model.mode);
      }
    }
  } else {
    const randomStart = model.startStates[Math.floor(Math.random() * model.startStates.length)];
    currentTokens = keyToTokens(randomStart, model.mode);
  }

  const outputTokens: string[] = [...currentTokens];
  let stoppedReason: 'length' | 'dead_end' | 'natural_end' = 'length';

  for (let i = 0; i < maxLength; i++) {
    const stateKey = stateToKey(currentTokens, model.mode);
    const trans = getStateTransitions(model, stateKey);

    if (!trans || trans.nextTokens.length === 0) {
      stoppedReason = 'dead_end';
      break;
    }

    const { token } = sampleNextToken(trans.nextTokens, temperature);
    outputTokens.push(token);

    // Update window
    currentTokens = [...currentTokens.slice(1), token];
  }

  return {
    text: detokenize(outputTokens, model.mode),
    tokensGenerated: outputTokens.length,
    stoppedReason,
  };
}

/**
 * Compute summary statistics for a Markov model
 */
export function getModelStats(model: MarkovModel): ModelStats {
  let totalTransitions = 0;
  model.transitions.forEach((nextMap) => {
    nextMap.forEach((count) => {
      totalTransitions += count;
    });
  });

  return {
    totalTokens: model.totalTokens,
    vocabSize: model.vocabulary.size,
    uniqueStates: model.transitions.size,
    totalTransitions,
    order: model.order,
    mode: model.mode,
  };
}
