export interface Variable {
  name: string;
  value: number | string;
  prevValue?: number | string;
  changed?: boolean;
}

export interface ExecutionStep {
  step: number;
  line: number;
  variables: Variable[];
  explanation: string;
  whatIf: string;
  activeElements: number[];
  treeHighlight: number[];
  action: string;
}

export const codeLines = [
  'function binarySearch(arr, target) {',
  '  let low = 0;',
  '  let high = arr.length - 1;',
  '',
  '  while (low <= high) {',
  '    let mid = Math.floor((low + high) / 2);',
  '',
  '    if (arr[mid] === target) {',
  '      return mid;',
  '    } else if (arr[mid] < target) {',
  '      low = mid + 1;',
  '    } else {',
  '      high = mid - 1;',
  '    }',
  '  }',
  '',
  '  return -1;',
  '}',
  '',
  '// binarySearch([1,3,5,7,9,11,13,15,17], 7)',
];

export const searchArray = [1, 3, 5, 7, 9, 11, 13, 15, 17];

export const executionSteps: ExecutionStep[] = [
  {
    step: 1, line: 2,
    variables: [
      { name: 'low', value: 0 },
      { name: 'high', value: 8 },
      { name: 'mid', value: '-' },
      { name: 'target', value: 7 },
    ],
    explanation: 'Initialize low = 0, pointing to the start of the array.',
    whatIf: 'If array was empty, we\'d return -1 immediately.',
    activeElements: [],
    treeHighlight: [0],
    action: 'Initialize search boundaries',
  },
  {
    step: 2, line: 3,
    variables: [
      { name: 'low', value: 0 },
      { name: 'high', value: 8 },
      { name: 'mid', value: '-' },
      { name: 'target', value: 7 },
    ],
    explanation: 'Initialize high = 8, pointing to the last element.',
    whatIf: 'With a single element array, low and high would both be 0.',
    activeElements: [0, 8],
    treeHighlight: [0],
    action: 'Set high boundary',
  },
  {
    step: 3, line: 6,
    variables: [
      { name: 'low', value: 0 },
      { name: 'high', value: 8 },
      { name: 'mid', value: 4, prevValue: '-', changed: true },
      { name: 'target', value: 7 },
    ],
    explanation: 'Calculate mid = floor((0 + 8) / 2) = 4. arr[4] = 9.',
    whatIf: 'What if mid = 3? arr[3] = 7 → we\'d find the target immediately!',
    activeElements: [4],
    treeHighlight: [0, 1],
    action: 'Calculate midpoint',
  },
  {
    step: 4, line: 10,
    variables: [
      { name: 'low', value: 0 },
      { name: 'high', value: 8 },
      { name: 'mid', value: 4 },
      { name: 'target', value: 7 },
    ],
    explanation: 'arr[4] = 9 > target (7). Search left half → set high = mid - 1.',
    whatIf: 'If arr[4] was 5, we\'d search right half instead.',
    activeElements: [4],
    treeHighlight: [0, 1],
    action: 'Compare: 9 > 7, go left',
  },
  {
    step: 5, line: 13,
    variables: [
      { name: 'low', value: 0 },
      { name: 'high', value: 3, prevValue: 8, changed: true },
      { name: 'mid', value: 4 },
      { name: 'target', value: 7 },
    ],
    explanation: 'Set high = mid - 1 = 3. Eliminated right half of array.',
    whatIf: 'What if we went right? We\'d miss the target entirely.',
    activeElements: [0, 1, 2, 3],
    treeHighlight: [0, 1, 2],
    action: 'Narrow search space',
  },
  {
    step: 6, line: 6,
    variables: [
      { name: 'low', value: 0 },
      { name: 'high', value: 3 },
      { name: 'mid', value: 1, prevValue: 4, changed: true },
      { name: 'target', value: 7 },
    ],
    explanation: 'Calculate mid = floor((0 + 3) / 2) = 1. arr[1] = 3.',
    whatIf: 'What if mid = 2? arr[2] = 5, still less than 7.',
    activeElements: [1],
    treeHighlight: [0, 1, 2, 3],
    action: 'Recalculate midpoint',
  },
  {
    step: 7, line: 10,
    variables: [
      { name: 'low', value: 0 },
      { name: 'high', value: 3 },
      { name: 'mid', value: 1 },
      { name: 'target', value: 7 },
    ],
    explanation: 'arr[1] = 3 < target (7). Search right half → set low = mid + 1.',
    whatIf: 'If target was 2, we\'d search left half here.',
    activeElements: [1],
    treeHighlight: [0, 1, 2, 3],
    action: 'Compare: 3 < 7, go right',
  },
  {
    step: 8, line: 11,
    variables: [
      { name: 'low', value: 2, prevValue: 0, changed: true },
      { name: 'high', value: 3 },
      { name: 'mid', value: 1 },
      { name: 'target', value: 7 },
    ],
    explanation: 'Set low = mid + 1 = 2. Only indices 2 and 3 remain.',
    whatIf: 'Only 2 elements left. Next step will find the answer.',
    activeElements: [2, 3],
    treeHighlight: [0, 1, 2, 3, 4],
    action: 'Move low pointer right',
  },
  {
    step: 9, line: 6,
    variables: [
      { name: 'low', value: 2 },
      { name: 'high', value: 3 },
      { name: 'mid', value: 2, prevValue: 1, changed: true },
      { name: 'target', value: 7 },
    ],
    explanation: 'Calculate mid = floor((2 + 3) / 2) = 2. arr[2] = 5.',
    whatIf: 'What if mid = 3? arr[3] = 7 → found it!',
    activeElements: [2],
    treeHighlight: [0, 1, 2, 3, 4, 5],
    action: 'Calculate midpoint again',
  },
  {
    step: 10, line: 10,
    variables: [
      { name: 'low', value: 2 },
      { name: 'high', value: 3 },
      { name: 'mid', value: 2 },
      { name: 'target', value: 7 },
    ],
    explanation: 'arr[2] = 5 < target (7). Search right → set low = mid + 1.',
    whatIf: 'If target was 5, we\'d return index 2 right now!',
    activeElements: [2],
    treeHighlight: [0, 1, 2, 3, 4, 5],
    action: 'Compare: 5 < 7, go right',
  },
  {
    step: 11, line: 11,
    variables: [
      { name: 'low', value: 3, prevValue: 2, changed: true },
      { name: 'high', value: 3 },
      { name: 'mid', value: 2 },
      { name: 'target', value: 7 },
    ],
    explanation: 'Set low = 3. Now low equals high — one element left.',
    whatIf: 'This is the last chance to find the target.',
    activeElements: [3],
    treeHighlight: [0, 1, 2, 3, 4, 5, 6],
    action: 'Converging on answer',
  },
  {
    step: 12, line: 6,
    variables: [
      { name: 'low', value: 3 },
      { name: 'high', value: 3 },
      { name: 'mid', value: 3, prevValue: 2, changed: true },
      { name: 'target', value: 7 },
    ],
    explanation: 'Calculate mid = floor((3 + 3) / 2) = 3. arr[3] = 7.',
    whatIf: 'mid = 3, checking arr[3]... this should be our target!',
    activeElements: [3],
    treeHighlight: [0, 1, 2, 3, 4, 5, 6, 7],
    action: 'Final midpoint calculation',
  },
  {
    step: 13, line: 8,
    variables: [
      { name: 'low', value: 3 },
      { name: 'high', value: 3 },
      { name: 'mid', value: 3 },
      { name: 'target', value: 7 },
    ],
    explanation: '🎯 arr[3] === 7 === target! Found at index 3! Binary search complete.',
    whatIf: 'Linear search would have taken 4 steps. Binary search: O(log n) = 3 comparisons.',
    activeElements: [3],
    treeHighlight: [0, 1, 2, 3, 4, 5, 6, 7],
    action: '✓ Target found!',
  },
];

export const treeNodes = [
  { id: 0, label: 'Start', x: 400, y: 20, children: [1] },
  { id: 1, label: 'mid=4 (9)', x: 400, y: 70, children: [2, 3] },
  { id: 2, label: 'Left half', x: 250, y: 120, children: [4, 5] },
  { id: 3, label: 'Right half', x: 550, y: 120, children: [] },
  { id: 4, label: 'mid=1 (3)', x: 250, y: 170, children: [6, 7] },
  { id: 5, label: 'Left of mid=4', x: 400, y: 170, children: [] },
  { id: 6, label: 'mid=2 (5)', x: 180, y: 220, children: [] },
  { id: 7, label: 'mid=3 (7) ✓', x: 320, y: 220, children: [] },
];
