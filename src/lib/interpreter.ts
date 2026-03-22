// ─────────────────────────────────────────────────────────────────────────────
// AlgoLens — Dynamic Code Interpreter
// Executes user-provided JS and captures each execution step
// ─────────────────────────────────────────────────────────────────────────────

import { interpretMergeSort, interpretQuickSort, interpretHeapSort } from './advancedAlgorithms';
import { generateRepoArchitecture, fetchFileSummary, generateFramerAnimationCode } from './geminiService';

export interface Variable {
  name: string;
  value: number | string | boolean | null | number[];
  prevValue?: number | string | boolean | null | number[];
  changed?: boolean;
  type?: string;
}

import { parse } from '@babel/parser';

export type StoryEvent = {
  id: number;
  type: 'declare' | 'assign' | 'if' | 'print' | 'loop_start' | 'loop_end';
  varName?: string;
  value?: any;
  condition?: string;
  pathSelected?: boolean;
  narration: string;
};

export interface ExecutionStep {
  step: number;
  line: number;
  variables: Variable[];
  explanation: string;
  whatIf: string;
  activeElements: number[];
  array?: number[];
  highlightedIndices?: { index: number; role: 'low' | 'high' | 'mid' | 'found' | 'comparing' | 'swapping' }[];
  treeHighlight: number[];
  action: string;
  callStack?: string[];
  returnValue?: string;
  phase?: 'init' | 'compare' | 'branch' | 'update' | 'return' | 'done';
  storyEvent?: StoryEvent;
}

export interface TreeNode {
  id: number;
  label: string;
  x: number;
  y: number;
  children: number[];
  value?: string;
}

export interface InterpreterResult {
  steps: ExecutionStep[];
  treeNodes: TreeNode[];
  arrayData?: number[];
  error?: string;
  algorithmType: 'binary-search' | 'bubble-sort' | 'merge-sort' | 'quick-sort' | 'heap-sort' | 'fibonacci' | 'linear-search' | 'factorial' | 'generic' | 'story';
  customFramerCode?: string;
}

// ─── Detect which algorithm the code is implementing ────────────────────────
export function detectAlgorithm(code: string): InterpreterResult['algorithmType'] {
  const lower = code.toLowerCase();
  if (lower.includes('binary') || (lower.includes('mid') && lower.includes('low') && lower.includes('high'))) return 'binary-search';
  if (lower.includes('bubble') || (lower.includes('swap') && lower.includes('arr[j]') && lower.includes('arr[j+1]'))) return 'bubble-sort';
  if (lower.includes('merge')) return 'merge-sort';
  if (lower.includes('quick') || lower.includes('pivot')) return 'quick-sort';
  if (lower.includes('heap')) return 'heap-sort';
  if (lower.includes('fibonacci') || lower.includes('fib(')) return 'fibonacci';
  if (lower.includes('factorial') || lower.includes('fact(')) return 'factorial';
  if (lower.includes('linear') || (lower.includes('for') && lower.includes('arr[i]') && lower.includes('target'))) return 'linear-search';
  return 'generic';
}

// ─── Parse all lines with trimming for display ───────────────────────────────
export function getCodeLines(code: string): string[] {
  return code.split('\n');
}

// ─── Binary Search Interpreter ───────────────────────────────────────────────
function interpretBinarySearch(code: string, arr?: number[], target?: number): InterpreterResult {
  const searchArray = arr || [1, 3, 5, 7, 9, 11, 13, 15, 17];
  const searchTarget = target ?? 7;
  const steps: ExecutionStep[] = [];

  let low = 0;
  let high = searchArray.length - 1;
  let mid = -1;
  let stepNum = 0;
  let foundAt = -1;

  const makeVars = (changedKey?: string, prevVals?: Record<string, number | string>): Variable[] => {
    const vars = [
      { name: 'low', value: low, changed: changedKey === 'low', prevValue: prevVals?.low },
      { name: 'high', value: high, changed: changedKey === 'high', prevValue: prevVals?.high },
      { name: 'mid', value: mid === -1 ? '-' : mid, changed: changedKey === 'mid', prevValue: prevVals?.mid ?? '-' },
      { name: 'target', value: searchTarget },
    ];
    return vars;
  };

  // Step 1: Init
  steps.push({
    step: ++stepNum, line: 2,
    variables: makeVars(),
    explanation: `Initialize search: low = 0 (start), high = ${high} (end of array with ${searchArray.length} elements).`,
    whatIf: 'If the array were empty, we\'d immediately return -1 without entering the loop.',
    activeElements: [0, high],
    array: [...searchArray],
    highlightedIndices: [{ index: 0, role: 'low' }, { index: high, role: 'high' }],
    treeHighlight: [0],
    action: 'Initialize boundaries',
    callStack: ['binarySearch()'],
    phase: 'init',
  });

  let iteration = 0;
  while (low <= high && iteration < 20) {
    iteration++;
    const prevMid = mid;
    mid = Math.floor((low + high) / 2);

    steps.push({
      step: ++stepNum, line: 6,
      variables: makeVars('mid', { mid: prevMid === -1 ? '-' : prevMid }),
      explanation: `Iteration ${iteration}: mid = ⌊(${low} + ${high}) / 2⌋ = ${mid}. arr[${mid}] = ${searchArray[mid]}.`,
      whatIf: `With an even-length array, mid would round down. arr[${mid}] = ${searchArray[mid]} will be compared to target (${searchTarget}).`,
      activeElements: [mid],
      array: [...searchArray],
      highlightedIndices: [
        { index: low, role: 'low' },
        { index: high, role: 'high' },
        { index: mid, role: 'mid' }
      ],
      treeHighlight: Array.from({ length: Math.min(stepNum, 8) }, (_, i) => i),
      action: `Calculate mid = ${mid}`,
      callStack: ['binarySearch()'],
      phase: 'compare',
    });

    if (searchArray[mid] === searchTarget) {
      foundAt = mid;
      steps.push({
        step: ++stepNum, line: 8,
        variables: makeVars(),
        explanation: `🎯 Found! arr[${mid}] = ${searchArray[mid]} === target (${searchTarget}). Return index ${mid}.`,
        whatIf: `Linear search would take up to ${searchTarget <= searchArray.length ? searchArray.indexOf(searchTarget) + 1 : searchArray.length} comparisons. Binary search took only ${iteration}.`,
        activeElements: [mid],
        array: [...searchArray],
        highlightedIndices: [{ index: mid, role: 'found' }],
        treeHighlight: Array.from({ length: Math.min(stepNum, 8) }, (_, i) => i),
        action: `✓ Found at index ${mid}!`,
        callStack: ['binarySearch()'],
        returnValue: `${mid}`,
        phase: 'done',
      });
      break;
    } else if (searchArray[mid] < searchTarget) {
      const prevLow = low;
      low = mid + 1;
      steps.push({
        step: ++stepNum, line: 11,
        variables: makeVars('low', { low: prevLow }),
        explanation: `arr[${mid}] = ${searchArray[mid]} < ${searchTarget}. Target is in the RIGHT half. Move low to ${low}.`,
        whatIf: `If we searched left instead, we'd never find ${searchTarget} — it would be outside the remaining search space.`,
        activeElements: Array.from({ length: high - low + 1 }, (_, i) => i + low),
        array: [...searchArray],
        highlightedIndices: [
          { index: low, role: 'low' },
          { index: high, role: 'high' },
        ],
        treeHighlight: Array.from({ length: Math.min(stepNum, 8) }, (_, i) => i),
        action: `${searchArray[mid]} < ${searchTarget}, go right`,
        callStack: ['binarySearch()'],
        phase: 'branch',
      });
    } else {
      const prevHigh = high;
      high = mid - 1;
      steps.push({
        step: ++stepNum, line: 13,
        variables: makeVars('high', { high: prevHigh }),
        explanation: `arr[${mid}] = ${searchArray[mid]} > ${searchTarget}. Target is in the LEFT half. Move high to ${high}.`,
        whatIf: `If we searched right instead, we'd skip past the target entirely.`,
        activeElements: high >= low ? Array.from({ length: high - low + 1 }, (_, i) => i + low) : [],
        array: [...searchArray],
        highlightedIndices: low <= high ? [
          { index: low, role: 'low' },
          { index: high, role: 'high' },
        ] : [],
        treeHighlight: Array.from({ length: Math.min(stepNum, 8) }, (_, i) => i),
        action: `${searchArray[mid]} > ${searchTarget}, go left`,
        callStack: ['binarySearch()'],
        phase: 'branch',
      });
    }
  }

  if (foundAt === -1) {
    steps.push({
      step: ++stepNum, line: 17,
      variables: makeVars(),
      explanation: `Search exhausted. low (${low}) > high (${high}), so target (${searchTarget}) is not in the array.`,
      whatIf: 'If we had used linear search, we would also confirm "not found" but only after checking every element.',
      activeElements: [],
      array: [...searchArray],
      highlightedIndices: [],
      treeHighlight: Array.from({ length: Math.min(stepNum, 8) }, (_, i) => i),
      action: '✗ Target not found',
      callStack: [],
      returnValue: '-1',
      phase: 'done',
    });
  }

  // Build tree nodes for binary search
  const treeNodes: TreeNode[] = [
    { id: 0, label: 'Start', x: 340, y: 20, children: [1] },
    { id: 1, label: `mid=${Math.floor((0 + searchArray.length - 1) / 2)}`, x: 340, y: 75, children: [2, 3] },
    { id: 2, label: 'Go Left', x: 180, y: 130, children: [4] },
    { id: 3, label: 'Go Right', x: 500, y: 130, children: [5] },
    { id: 4, label: foundAt < Math.floor((0 + searchArray.length - 1) / 2) ? `Found [${foundAt}]` : 'Search', x: 120, y: 185, children: [] },
    { id: 5, label: foundAt > Math.floor((0 + searchArray.length - 1) / 2) ? `Found [${foundAt}]` : 'Search', x: 560, y: 185, children: [] },
  ];

  return { steps, treeNodes, arrayData: searchArray, algorithmType: 'binary-search' };
}

// ─── Bubble Sort Interpreter ──────────────────────────────────────────────────
function interpretBubbleSort(arr?: number[]): InterpreterResult {
  const array = arr || [64, 34, 25, 12, 22, 11, 90];
  const steps: ExecutionStep[] = [];
  const a = [...array];
  let stepNum = 0;
  const n = a.length;

  steps.push({
    step: ++stepNum, line: 1,
    variables: [{ name: 'arr', value: `[${a.join(',')}]` }, { name: 'n', value: n }],
    explanation: `Starting bubble sort on array of ${n} elements. We'll bubble the largest unsorted element to its correct position each pass.`,
    whatIf: 'If the array were already sorted, an optimized version could detect this and stop early.',
    activeElements: [],
    array: [...a],
    highlightedIndices: [],
    treeHighlight: [0],
    action: 'Initialize bubble sort',
    callStack: ['bubbleSort()'],
    phase: 'init',
  });

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        step: ++stepNum, line: 6,
        variables: [
          { name: 'i', value: i }, { name: 'j', value: j },
          { name: 'arr[j]', value: a[j] }, { name: 'arr[j+1]', value: a[j + 1] }
        ],
        explanation: `Pass ${i + 1}, comparing arr[${j}]=${a[j]} and arr[${j + 1}]=${a[j + 1]}.`,
        whatIf: `If arr[${j}] ≤ arr[${j + 1}], no swap needed — elements stay in place.`,
        activeElements: [j, j + 1],
        array: [...a],
        highlightedIndices: [{ index: j, role: 'comparing' }, { index: j + 1, role: 'comparing' }],
        treeHighlight: [0, 1, i + 2 < 6 ? i + 2 : 5],
        action: `Compare [${j}] and [${j + 1}]`,
        callStack: ['bubbleSort()'],
        phase: 'compare',
      });

      if (a[j] > a[j + 1]) {
        steps.push({
          step: ++stepNum, line: 8,
          variables: [
            { name: 'i', value: i }, { name: 'j', value: j },
            { name: 'arr[j]', value: a[j] }, { name: 'arr[j+1]', value: a[j + 1] }
          ],
          explanation: `About to swap ${a[j]} and ${a[j + 1]}`,
          whatIf: 'We have identified an out-of-order pair.',
          activeElements: [j, j + 1],
          array: [...a],
          highlightedIndices: [{ index: j, role: 'swapping' }, { index: j + 1, role: 'swapping' }],
          treeHighlight: [0, 1, i + 2 < 6 ? i + 2 : 5],
          action: `Preparing swap ${a[j]} ↔ ${a[j + 1]}`,
          callStack: ['bubbleSort()'],
          phase: 'compare',
        });

        const tmp = a[j]; a[j] = a[j + 1]; a[j + 1] = tmp;
        swapped = true;
        steps.push({
          step: ++stepNum, line: 8,
          variables: [
            { name: 'i', value: i }, { name: 'j', value: j },
            { name: 'arr[j]', value: a[j], changed: true, prevValue: a[j + 1] },
            { name: 'arr[j+1]', value: a[j + 1], changed: true, prevValue: a[j] }
          ],
          explanation: `Swap! ${a[j + 1]} > ${a[j]}, so arr[${j}] and arr[${j + 1}] are swapped.`,
          whatIf: 'Without this swap, larger elements would stay in incorrect positions.',
          activeElements: [j, j + 1],
          array: [...a],
          highlightedIndices: [{ index: j, role: 'swapping' }, { index: j + 1, role: 'swapping' }],
          treeHighlight: [0, 1, i + 2 < 6 ? i + 2 : 5],
          action: `Swap ${a[j + 1]} ↔ ${a[j]}`,
          callStack: ['bubbleSort()'],
          phase: 'update',
        });
      }
    }

    if (!swapped) {
      steps.push({
        step: ++stepNum, line: 13,
        variables: [{ name: 'swapped', value: false }],
        explanation: 'No swaps occurred during this entire pass! This strictly means the array is perfectly sorted, triggering an early break.',
        whatIf: 'This powerful optimization saves massive O(N^2) processing time on semi-sorted arrays.',
        activeElements: [],
        array: [...a],
        highlightedIndices: [],
        treeHighlight: [0],
        action: 'Early Sort Optimization Triggered!',
        callStack: ['bubbleSort()'],
        phase: 'return',
      });
      break;
    }
  }

  steps.push({
    step: ++stepNum, line: 15,
    variables: [{ name: 'sorted', value: `[${a.join(',')}]` }],
    explanation: `✓ Array sorted! Final result: [${a.join(', ')}]`,
    whatIf: 'Bubble sort is O(n²) — for large arrays, merge sort or quicksort would be much faster.',
    activeElements: Array.from({ length: n }, (_, i) => i),
    array: [...a],
    highlightedIndices: Array.from({ length: n }, (_, i) => ({ index: i, role: 'found' as const })),
    treeHighlight: [0, 1, 2, 3, 4, 5],
    action: '✓ Sort complete!',
    callStack: [],
    returnValue: `[${a.join(',')}]`,
    phase: 'done',
  });

  const treeNodes: TreeNode[] = [
    { id: 0, label: 'Start', x: 340, y: 20, children: [1] },
    { id: 1, label: 'Pass 1', x: 200, y: 75, children: [2] },
    { id: 2, label: 'Pass 2', x: 340, y: 75, children: [3] },
    { id: 3, label: 'Pass 3', x: 480, y: 75, children: [4] },
    { id: 4, label: 'Compare', x: 240, y: 130, children: [5] },
    { id: 5, label: 'Swap?', x: 440, y: 130, children: [] },
  ];

  return { steps, treeNodes, arrayData: array, algorithmType: 'bubble-sort' };
}

// ─── Fibonacci Interpreter ────────────────────────────────────────────────────
function interpretFibonacci(n: number = 7): InterpreterResult {
  const steps: ExecutionStep[] = [];
  let stepNum = 0;
  const memo: Record<number, number> = {};

  const fib = (k: number, depth: number): number => {
    if (k <= 1) {
      steps.push({
        step: ++stepNum, line: 2,
        variables: [{ name: 'n', value: k }, { name: 'depth', value: depth }],
        explanation: `Base case: fib(${k}) = ${k}. No recursion needed.`,
        whatIf: 'If we didn\'t have base cases, the recursion would run forever.',
        activeElements: [k],
        treeHighlight: Array.from({ length: Math.min(depth + 1, 8) }, (_, i) => i),
        action: `fib(${k}) = ${k} (base)`,
        callStack: Array.from({ length: depth + 1 }, (_, i) => `fib(${k - i})`).reverse(),
        returnValue: `${k}`,
        phase: 'return',
      });
      return k;
    }

    steps.push({
      step: ++stepNum, line: 4,
      variables: [{ name: 'n', value: k }, { name: 'depth', value: depth }],
      explanation: `fib(${k}) needs fib(${k - 1}) + fib(${k - 2}). Making recursive calls.`,
      whatIf: `With memoization, fib(${k}) would only be computed once, reducing time from O(2ⁿ) to O(n).`,
      activeElements: [k],
      treeHighlight: Array.from({ length: Math.min(depth + 1, 8) }, (_, i) => i),
      action: `Call fib(${k - 1}) + fib(${k - 2})`,
      callStack: Array.from({ length: depth + 1 }, (_, i) => `fib(${k - i})`).reverse(),
      phase: 'compare',
    });

    const left = fib(k - 1, depth + 1);
    const right = fib(k - 2, depth + 1);
    const result = left + right;

    steps.push({
      step: ++stepNum, line: 4,
      variables: [
        { name: 'n', value: k },
        { name: 'left', value: left },
        { name: 'right', value: right },
        { name: 'result', value: result, changed: true }
      ],
      explanation: `fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${left} + ${right} = ${result}`,
      whatIf: 'Notice the overlapping subproblems — fib values are recomputed multiple times.',
      activeElements: [k],
      treeHighlight: Array.from({ length: Math.min(depth + 1, 8) }, (_, i) => i),
      action: `fib(${k}) = ${result}`,
      callStack: Array.from({ length: depth + 1 }, (_, i) => `fib(${k - i})`).reverse(),
      returnValue: `${result}`,
      phase: 'return',
    });

    return result;
  };

  const result = fib(Math.min(n, 8), 0);

  const treeNodes: TreeNode[] = [
    { id: 0, label: `fib(${n})`, x: 340, y: 20, children: [1, 2] },
    { id: 1, label: `fib(${n - 1})`, x: 200, y: 80, children: [3, 4] },
    { id: 2, label: `fib(${n - 2})`, x: 480, y: 80, children: [5] },
    { id: 3, label: `fib(${n - 2})`, x: 120, y: 140, children: [] },
    { id: 4, label: `fib(${n - 3})`, x: 280, y: 140, children: [] },
    { id: 5, label: `fib(${n - 3})`, x: 480, y: 140, children: [] },
  ];

  return { steps, treeNodes, algorithmType: 'fibonacci' };
}

// ─── Factorial Interpreter ────────────────────────────────────────────────────
function interpretFactorial(n: number = 5): InterpreterResult {
  const steps: ExecutionStep[] = [];
  let stepNum = 0;

  const fact = (k: number): number => {
    if (k <= 1) {
      steps.push({
        step: ++stepNum, line: 2,
        variables: [{ name: 'n', value: k }],
        explanation: `Base case: factorial(${k}) = 1. The recursion bottoms out here.`,
        whatIf: 'Without a base case, the function would recurse infinitely and cause a stack overflow.',
        activeElements: [k],
        treeHighlight: [0, 1, 2, 3, 4, 5].slice(0, n - k + 2),
        action: `factorial(${k}) = 1 (base case)`,
        callStack: Array.from({ length: n - k + 1 }, (_, i) => `factorial(${k + i})`),
        returnValue: '1',
        phase: 'return',
      });
      return 1;
    }

    steps.push({
      step: ++stepNum, line: 4,
      variables: [{ name: 'n', value: k }],
      explanation: `factorial(${k}) = ${k} × factorial(${k - 1}). Recursing deeper.`,
      whatIf: `If n = 0, we'd return 1 (0! = 1 by definition).`,
      activeElements: [k],
      treeHighlight: [0, 1, 2, 3, 4, 5].slice(0, n - k + 2),
      action: `Call factorial(${k - 1})`,
      callStack: Array.from({ length: n - k + 1 }, (_, i) => `factorial(${k + i})`),
      phase: 'compare',
    });

    const sub = fact(k - 1);
    const result = k * sub;

    steps.push({
      step: ++stepNum, line: 4,
      variables: [
        { name: 'n', value: k },
        { name: 'sub', value: sub },
        { name: 'result', value: result, changed: true }
      ],
      explanation: `Returning: ${k} × ${sub} = ${result}. Unwinding the call stack.`,
      whatIf: `Iterative version would use a loop instead and avoid stack overhead.`,
      activeElements: [k],
      treeHighlight: [0, 1, 2, 3, 4, 5].slice(0, n - k + 2),
      action: `factorial(${k}) = ${result}`,
      callStack: Array.from({ length: n - k + 1 }, (_, i) => `factorial(${k + i})`),
      returnValue: `${result}`,
      phase: 'return',
    });

    return result;
  };

  fact(Math.min(n, 8));

  const treeNodes: TreeNode[] = Array.from({ length: Math.min(n + 1, 7) }, (_, i) => ({
    id: i,
    label: i === 0 ? `fact(${n})` : i === n ? 'base' : `fact(${n - i})`,
    x: 340,
    y: 20 + i * 55,
    children: i < Math.min(n, 6) ? [i + 1] : [],
  }));

  return { steps, treeNodes, algorithmType: 'factorial' };
}

// ─── Linear Search Interpreter ────────────────────────────────────────────────
function interpretLinearSearch(arr?: number[], target?: number): InterpreterResult {
  const searchArray = arr || [4, 2, 7, 1, 9, 3, 8];
  const searchTarget = target ?? 9;
  const steps: ExecutionStep[] = [];
  let stepNum = 0;

  steps.push({
    step: ++stepNum, line: 1,
    variables: [{ name: 'target', value: searchTarget }, { name: 'i', value: 0 }],
    explanation: `Starting linear search for ${searchTarget} in array of ${searchArray.length} elements. We check each element in order.`,
    whatIf: 'If the array were sorted, we could use binary search for O(log n) instead of O(n).',
    activeElements: [],
    array: [...searchArray],
    highlightedIndices: [],
    treeHighlight: [0],
    action: 'Begin linear scan',
    callStack: ['linearSearch()'],
    phase: 'init',
  });

  for (let i = 0; i < searchArray.length; i++) {
    steps.push({
      step: ++stepNum, line: 3,
      variables: [{ name: 'i', value: i }, { name: 'arr[i]', value: searchArray[i] }, { name: 'target', value: searchTarget }],
      explanation: `Check arr[${i}] = ${searchArray[i]}. Is it equal to ${searchTarget}?`,
      whatIf: i === 0 ? 'If the target were the first element, we\'d find it immediately.' : `We've already checked ${i} element${i > 1 ? 's' : ''}.`,
      activeElements: [i],
      array: [...searchArray],
      highlightedIndices: [{ index: i, role: 'comparing' }],
      treeHighlight: [0, Math.min(i + 1, 6)],
      action: `Check arr[${i}] = ${searchArray[i]}`,
      callStack: ['linearSearch()'],
      phase: 'compare',
    });

    if (searchArray[i] === searchTarget) {
      steps.push({
        step: ++stepNum, line: 4,
        variables: [{ name: 'i', value: i }, { name: 'result', value: i, changed: true }],
        explanation: `✓ Found ${searchTarget} at index ${i} after ${i + 1} comparison${i > 0 ? 's' : ''}!`,
        whatIf: `Binary search would find this in ≤ ${Math.ceil(Math.log2(searchArray.length))} comparisons if the array were sorted.`,
        activeElements: [i],
        array: [...searchArray],
        highlightedIndices: [{ index: i, role: 'found' }],
        treeHighlight: [0, 1, 2, 3, 4, 5, 6].slice(0, i + 2),
        action: `✓ Found at index ${i}!`,
        callStack: [],
        returnValue: `${i}`,
        phase: 'done',
      });
      break;
    }
  }

  const treeNodes: TreeNode[] = [
    { id: 0, label: 'Start', x: 340, y: 20, children: [1] },
    ...searchArray.slice(0, 6).map((v, i) => ({
      id: i + 1,
      label: `[${i}]=${v}`,
      x: 80 + i * 110,
      y: 80,
      children: i < 5 ? [i + 2] : [],
    }))
  ];

  return { steps, treeNodes, arrayData: searchArray, algorithmType: 'linear-search' };
}

// ─── Generic Code Interpreter (Story Mode Blueprint) ───────────────────
function interpretGeneric(code: string): InterpreterResult {
  const storyEvents: StoryEvent[] = [];
  let eventId = 0;

  try {
    const ast = parse(code, { sourceType: 'module' });
    const env: Record<string, any> = {};

    const evaluate = (node: any): any => {
      if (!node) return undefined;
      if (node.type === 'NumericLiteral') return node.value;
      if (node.type === 'StringLiteral') return node.value;
      if (node.type === 'BooleanLiteral') return node.value;
      if (node.type === 'Identifier') return env[node.name];
      if (node.type === 'BinaryExpression') {
        const left = evaluate(node.left);
        const right = evaluate(node.right);
        switch (node.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return left / right;
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
          case '===': case '==': return left === right;
          case '!==': case '!=': return left !== right;
        }
      }
      return undefined;
    };

    const walk = (node: any) => {
      if (!node) return;
      if (node.type === 'VariableDeclaration') {
        node.declarations.forEach((decl: any) => {
          const varName = decl.id.name;
          const val = evaluate(decl.init);
          env[varName] = val;
          storyEvents.push({
            id: eventId++,
            type: 'declare',
            varName,
            value: val !== undefined ? val : '?',
            narration: `We create a new character named "${varName}" holding the value ${val}.`
          });
        });
      }
      if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
        const varName = node.expression.left.name;
        const val = evaluate(node.expression.right);
        env[varName] = val;
        storyEvents.push({
          id: eventId++,
          type: 'assign',
          varName,
          value: val,
          narration: `"${varName}" gets a shiny new payload and transforms to ${val}.`
        });
      }
      if (node.type === 'IfStatement') {
        const hasBounds = node.test && typeof node.test.start === 'number' && typeof node.test.end === 'number';
        const condRaw = hasBounds ? code.substring(node.test.start, node.test.end).replace(/\n/g, ' ').trim() : 'Condition Check';
        const passed = evaluate(node.test);
        storyEvents.push({
          id: eventId++,
          type: 'if',
          condition: condRaw,
          pathSelected: !!passed,
          narration: `We approach a crossroads: Is "${condRaw}"? The logic answers ${passed ? 'TRUE' : 'FALSE'}!`
        });
        if (passed) walk(node.consequent);
        else if (node.alternate) walk(node.alternate);
      }
      if (node.type === 'ForStatement' || node.type === 'WhileStatement') {
        storyEvents.push({
          id: eventId++,
          type: 'loop_start',
          narration: 'We enter the loop cyclone! Operations here repeat cyclically.'
        });
        walk(node.body); // Single pass trace visualization for simplicity.
        storyEvents.push({
          id: eventId++,
          type: 'loop_end',
          narration: 'The loop winds down, and we advance forward.'
        });
      }
      if (node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression') {
        if (node.expression.callee.object?.name === 'console' && node.expression.callee.property?.name === 'log') {
          const arg = node.expression.arguments[0];
          const hasBounds = arg && typeof arg.start === 'number' && typeof arg.end === 'number';
          const val = evaluate(arg) ?? (hasBounds ? code.substring(arg.start, arg.end) : 'Output');
          storyEvents.push({
            id: eventId++,
            type: 'print',
            value: val,
            narration: `The program broadcasts an output: "${val}"!`
          });
        } else {
          const calleeName = node.expression.callee.name;
          storyEvents.push({
            id: eventId++,
            type: 'print',
            value: `Calling ${calleeName}()`,
            narration: `Executing function layer: ${calleeName}.`
          });
        }
      }
      if (node.type === 'BlockStatement') node.body.forEach(walk);
      if (node.type === 'Program') node.body.forEach(walk);
    };

    walk(ast.program);
  } catch (e) {
    console.error("Story Mode Parse Error:", e);
  }

  // Base fallback if parsing literally finds nothing or syntax breaks
  if (storyEvents.length === 0) {
    storyEvents.push({
      id: 0, type: 'print', value: 'Hello World', narration: 'We stand at the very beginning of standard code execution.'
    });
  }

  const steps: ExecutionStep[] = storyEvents.map((evt, i) => ({
    step: i + 1,
    line: 1, // Doesn't matter because we use story layout
    variables: [],
    explanation: evt.narration,
    whatIf: '',
    activeElements: [],
    treeHighlight: [0],
    action: evt.type,
    phase: 'done',
    storyEvent: evt
  }));

  const treeNodes: TreeNode[] = [
    { id: 0, label: 'Story AST', x: 340, y: 20, children: [] }
  ];

  return { steps, treeNodes, algorithmType: 'story' };
}

// ─── AI Dynamic Sandbox Interpreter (Code → Component) ────────────────────────
async function interpretAIAnimation(code: string): Promise<InterpreterResult> {
  const trimmedCode = code.trim();
  if (!trimmedCode || trimmedCode === '// Write your own custom logic here...' || trimmedCode.length < 5) {
     return {
       steps: [{ step: 1, line: 1, variables: [], explanation: 'Ready to build your execution trace...', whatIf: 'Type some code to see a custom animation!', activeElements: [], treeHighlight: [0], action: 'Wait for Input', phase: 'done' }],
       treeNodes: [{ id: 0, label: 'Empty Sandbox', x: 340, y: 20, children: [] }],
       algorithmType: 'generic',
       customFramerCode: "const Visualizer = () => <div className='flex items-center justify-center h-full text-white/40 font-mono tracking-widest uppercase animate-pulse'>Initialize Execution Vector...</div>;"
     };
  }

  const customFramerCode = await generateFramerAnimationCode(code, "AST Generated On Backend");

  const steps: ExecutionStep[] = [{
    step: 1, line: 1, variables: [], explanation: 'Evaluating Dynamic Sandbox Script...', 
    whatIf: 'The AI is building custom Framer Motion tracking vectors for this specific syntax tree.', 
    activeElements: [], treeHighlight: [0], action: 'Deploy Custom Sandbox Component', phase: 'done'
  }];

  const treeNodes: TreeNode[] = [{ id: 0, label: 'Dynamic Sandbox', x: 340, y: 20, children: [] }];

  return { steps, treeNodes, algorithmType: 'generic', customFramerCode };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────
export async function interpretCode(code: string): Promise<InterpreterResult> {
  try {
    const type = detectAlgorithm(code);

    // Extract array literals from code like [1,3,5,7,9]
    const arrayMatch = code.match(/\[([0-9,\s\-]+)\]/);
    let userArray = arrayMatch
      ? arrayMatch[1].split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
      : undefined;

    // Apply strict uniqueness to array values for flawless Framer-Motion layout DOM swaps
    if (userArray) {
      const counts = new Map<number, number>();
      userArray = userArray.map(n => {
        const c = (counts.get(n) || 0) + 1;
        counts.set(n, c);
        return n + (c * 0.00001); // Visually 5, Objectively 5.00001 for unique React Keys
      });
    }

    // Extract target value
    const targetMatch = code.match(/(?:target|find|search|val|value|x|n)\s*[=:]\s*(-?\d+)/i)
      || code.match(/,\s*(-?\d+)\s*\)/);
    const userTarget = targetMatch ? parseInt(targetMatch[1]) : undefined;

    // Extract N for fibonacci/factorial
    const nMatch = code.match(/(?:factorial|fibonacci|fib|fact|calc)\(\s*(\d+)\s*\)/i);
    let userN = nMatch ? parseInt(nMatch[1], 10) : 5;

    switch (type) {
      case 'binary-search': return Promise.resolve(interpretBinarySearch(code, userArray, userTarget));
      case 'bubble-sort': return Promise.resolve(interpretBubbleSort(userArray));
      case 'merge-sort': return Promise.resolve(interpretMergeSort(userArray));
      case 'quick-sort': return Promise.resolve(interpretQuickSort(userArray));
      case 'heap-sort': return Promise.resolve(interpretHeapSort(userArray));
      case 'fibonacci': return Promise.resolve(interpretFibonacci(userN));
      case 'factorial': return Promise.resolve(interpretFactorial(userN));
      case 'linear-search': return Promise.resolve(interpretLinearSearch(userArray, userTarget));
      case 'story': return Promise.resolve(interpretGeneric(code)); // Use generic interpreter for story mode
      default: 
        return await interpretAIAnimation(code);
    }
  } catch (e: any) {
    const errorMsg = String(e.message || e);
    const isReference = errorMsg.includes('is not defined') || e.name === 'ReferenceError';
    const isSyntax = e.name === 'SyntaxError';
    const isType = e.name === 'TypeError';

    let errorLine = 1;
    if (e.stack) {
      const match = e.stack.match(/<anonymous>:(\d+)/);
      if (match) errorLine = Math.max(1, parseInt(match[1], 10) - 2); // -2 because of the new Function closure wrapper offset
    }

    let fixReason = 'Check your code for typos or missing brackets.';

    // Explicit API or formatting failures from Gemini trace
    if (errorMsg.includes('fetch') || errorMsg.includes('API') || errorMsg.includes('Quota') || errorMsg.includes('AI returned')) {
      fixReason = "This is a Google Gemini API connection issue, not a typo in your code! Please ensure you have a valid API quota or wait for the rate limit to cool down.";
    } else {
      if (isReference) fixReason = "You tried to use a variable or function that hasn't been declared yet. Did you misspell it or forget to use 'let' or 'const'?";
      if (isSyntax) fixReason = "There is a structural mistake in the code (like a missing comma, unclosed bracket, or invalid keyword).";
      if (isType) fixReason = "You tried to perform an operation on a wrong type, like calling something that isn't a function, or reading a property of undefined.";
    }

    return {
      steps: [{
        step: 1, line: errorLine,
        variables: [],
        explanation: `🚨 ERROR DETECTED: [${e.name || 'Runtime Error'}] ${errorMsg}\n\nWhy it happened: ${fixReason}`,
        whatIf: 'Fix the error highlighted above and click Run & Visualize again.',
        activeElements: [],
        treeHighlight: [],
        action: 'Runtime Error',
        phase: 'done' as const,
        returnValue: 'Failed'
      }],
      treeNodes: [{ id: 0, label: 'Error', x: 340, y: 20, children: [] }],
      algorithmType: 'generic' as const,
      error: String(e),
    };
  }
}

export const ALGORITHM_TEMPLATES: Record<string, string> = {
  'Binary Search': `function binarySearch(arr, target) {
  let low = 0;
  let high = arr.length - 1;

  while (low <= high) {
    let mid = Math.floor((low + high) / 2);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return -1;
}

// binarySearch([1,3,5,7,9,11,13,15,17], 7)`,

  'Bubble Sort': `function bubbleSort(arr) {
  let n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return arr;
}

// bubbleSort([64, 34, 25, 12, 22, 11, 90])`,

  'Merge Sort': `function mergeSort(arr, l = 0, r = arr.length - 1) {
  if (l >= r) return;
  const m = Math.floor((l + r) / 2);
  mergeSort(arr, l, m);
  mergeSort(arr, m + 1, r);
  merge(arr, l, m, r);
  return arr;
}

function merge(arr, l, m, r) {
  const left = arr.slice(l, m + 1);
  const right = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) arr[k++] = left[i++];
    else arr[k++] = right[j++];
  }
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}

// mergeSort([38, 27, 43, 3, 9, 82, 10])`,

  'Quick Sort': `function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  
  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      let temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  
  let temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;
  
  return i + 1;
}

// quickSort([10, 80, 30, 90, 40, 50, 70])`,

  'Heap Sort': `function heapSort(arr) {
  let n = arr.length;

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--)
    heapify(arr, n, i);

  for (let i = n - 1; i > 0; i--) {
    let temp = arr[0];
    arr[0] = arr[i];
    arr[i] = temp;
    heapify(arr, i, 0);
  }
  return arr;
}

function heapify(arr, n, i) {
  let largest = i;
  let l = 2 * i + 1;
  let r = 2 * i + 2;

  if (l < n && arr[l] > arr[largest]) largest = l;
  if (r < n && arr[r] > arr[largest]) largest = r;

  if (largest != i) {
    let swap = arr[i];
    arr[i] = arr[largest];
    arr[largest] = swap;
    heapify(arr, n, largest);
  }
}

// heapSort([4, 10, 3, 5, 1])`,

  'Fibonacci': `function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// fibonacci(7)`,

  'Factorial': `function factorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

// factorial(5)`,

  'Linear Search': `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}

// linearSearch([4, 2, 7, 1, 9, 3, 8], 9)`,

  'Story Mode': `// Write code to generate a Cinematic Animation!
// Allowed syntax: variables, conditionals, loops, and console messages.

let hero = "🤖 Robot";
let power = 100;

if (power > 50) {
  console.log("Systems nominal. Ready to deploy.");
}

for (let i = 0; i < 3; i++) {
  power = power - 10;
}

console.log("Mission critical. Energy low!");`,

  'Blank Template': `// Write your custom algorithm here!
// AlgoLens will catch errors automatically.

function myAlgorithm(data) {
  // Try making a typo to see the error catcher!
  console.log("Processing", data);
  return data;
}

myAlgorithm([1, 2, 3]);`,
};
