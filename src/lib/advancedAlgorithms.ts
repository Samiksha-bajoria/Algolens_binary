import { ExecutionStep, InterpreterResult, TreeNode } from './interpreter';

export function interpretMergeSort(arr?: number[]): InterpreterResult {
  const a = arr ? [...arr] : [38, 27, 43, 3, 9, 82, 10];
  const steps: ExecutionStep[] = [];
  const treeNodes: TreeNode[] = [{ id: 0, label: 'Start', x: 340, y: 30, children: [] }];
  let nodeId = 0;
  let stepNum = 1;

  steps.push({ 
    step: stepNum++, line: 1, variables: [], 
    explanation: 'Initializing Merge Sort.', whatIf: '', treeHighlight: [0],
    action: 'Init', phase: 'init', activeElements: [], array: [...a] 
  });

  function merge(l: number, m: number, r: number, parentNode: number) {
    const left = a.slice(l, m + 1);
    const right = a.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    
    steps.push({ 
      step: stepNum++, line: 9, variables: [], 
      explanation: `Merging halves: [${left.join(',')}] and [${right.join(',')}]`, 
      whatIf: 'Merge compares the front of both sorted halves.', treeHighlight: [parentNode],
      action: 'Merge Start', phase: 'compare', activeElements: [l, r], array: [...a] 
    });

    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) { a[k] = left[i]; i++; } else { a[k] = right[j]; j++; }
      steps.push({ 
        step: stepNum++, line: 11, variables: [{name: 'k', value: k}], 
        explanation: `Placed ${a[k]} at index ${k}`, 
        whatIf: 'We pick the smaller element to keep the merged array sorted.', treeHighlight: [parentNode],
        action: 'Merge Update', phase: 'update', activeElements: [k], array: [...a],
        highlightedIndices: [{index: k, role: 'mid'}]
      });
      k++;
    }
    
    while (i < left.length) {
      a[k] = left[i]; i++; k++;
      steps.push({ 
        step: stepNum++, line: 15, variables: [{name: 'k', value: k-1}], 
        explanation: `Placed remaining ${a[k-1]}`, 
        whatIf: 'If one half is exhausted, dump the rest of the other half.', treeHighlight: [parentNode],
        action: 'Flush Left', phase: 'update', activeElements: [k-1], array: [...a] 
      });
    }
    while (j < right.length) {
      a[k] = right[j]; j++; k++;
      steps.push({ 
        step: stepNum++, line: 17, variables: [{name: 'k', value: k-1}], 
        explanation: `Placed remaining ${a[k-1]}`, 
        whatIf: 'If one half is exhausted, dump the rest of the other half.', treeHighlight: [parentNode],
        action: 'Flush Right', phase: 'update', activeElements: [k-1], array: [...a] 
      });
    }
  }

  function mergeSort(l: number, r: number, parentNode: number) {
    if (l < r) {
      const m = Math.floor((l + r) / 2);
      const leftId = ++nodeId; const rightId = ++nodeId;
      treeNodes[parentNode].children.push(leftId, rightId);
      
      const depth = Math.max(1, treeNodes[parentNode].y / 60);
      const spread = Math.max(160 / depth, 50);
      
      treeNodes.push({ id: leftId, label: `L(${l}..${m})`, x: treeNodes[parentNode].x - spread, y: treeNodes[parentNode].y + 60, children: [] });
      treeNodes.push({ id: rightId, label: `R(${m + 1}..${r})`, x: treeNodes[parentNode].x + spread, y: treeNodes[parentNode].y + 60, children: [] });
      
      steps.push({ 
        step: stepNum++, line: 3, variables: [{name:'l', value:l}, {name:'r', value:r}], 
        explanation: `Splitting array [${l}..${r}]`, 
        whatIf: 'This branch continuously halves the array until base cases of size 1 are met.', treeHighlight: [parentNode],
        action: 'Split', phase: 'branch', activeElements: Array.from({length: r-l+1}, (_, i)=>i+l), array: [...a] 
      });

      mergeSort(l, m, leftId);
      mergeSort(m + 1, r, rightId);
      merge(l, m, r, parentNode);
    }
  }
  
  mergeSort(0, a.length - 1, 0);
  steps.push({ 
    step: stepNum++, line: 20, variables: [], 
    explanation: 'Merge Sort complete!', whatIf: 'Merge sort strictly takes O(N log N) time.', treeHighlight: [0],
    action: 'Done', phase: 'done', activeElements: [], array: [...a] 
  });
  return { steps, treeNodes, arrayData: a, algorithmType: 'merge-sort' };
}

export function interpretQuickSort(arr?: number[]): InterpreterResult {
  const a = arr ? [...arr] : [10, 80, 30, 90, 40, 50, 70];
  const steps: ExecutionStep[] = [];
  const treeNodes: TreeNode[] = [{ id: 0, label: 'Start', x: 340, y: 30, children: [] }];
  let nodeId = 0;
  let stepNum = 1;

  steps.push({ 
    step: stepNum++, line: 1, variables: [], 
    explanation: 'Initializing Quick Sort.', whatIf: '', treeHighlight: [0],
    action: 'Init', phase: 'init', activeElements: [], array: [...a] 
  });

  function qs(low: number, high: number, parentNode: number) {
    if (low < high) {
      const pivot = a[high];
      steps.push({ 
        step: stepNum++, line: 4, variables: [{name: 'pivot', value: pivot}], 
        explanation: `Selected pivot: ${pivot}`, whatIf: 'Pivot choices determine performance. Here we just pick the last item.', treeHighlight: [parentNode],
        action: 'Pivot', phase: 'init', activeElements: [high], array: [...a],
        highlightedIndices: [{index: high, role: 'high'}]
      });
      
      let i = low - 1;
      for (let j = low; j < high; j++) {
        steps.push({ 
          step: stepNum++, line: 7, variables: [{name: 'pivot', value: pivot}], 
          explanation: `Comparing ${a[j]} < ${pivot}`, whatIf: 'Grouping smaller elements to the left of the pivot.', treeHighlight: [parentNode],
          action: 'Compare', phase: 'compare', activeElements: [j, high], array: [...a],
          highlightedIndices: [{index: j, role: 'comparing'}, {index: high, role: 'comparing'}]
        });
        if (a[j] < pivot) {
          i++;
          const t = a[i]; a[i] = a[j]; a[j] = t;
          steps.push({ 
            step: stepNum++, line: 9, variables: [{name: 'i', value: i}], 
            explanation: `Swapped index ${i} and ${j}`, whatIf: '', treeHighlight: [parentNode],
            action: 'Swap', phase: 'update', activeElements: [i, j], array: [...a],
            highlightedIndices: [{index: i, role: 'swapping'}, {index: j, role: 'swapping'}]
          });
        }
      }
      
      const t = a[i + 1]; a[i + 1] = a[high]; a[high] = t;
      steps.push({ 
        step: stepNum++, line: 12, variables: [{name: 'pivot', value: pivot}], 
        explanation: `Placed pivot ${pivot} at ${i+1}`, whatIf: 'The pivot is now perfectly in its final sorted position.', treeHighlight: [parentNode],
        action: 'Place Pivot', phase: 'update', activeElements: [i+1, high], array: [...a],
        highlightedIndices: [{index: i+1, role: 'found'}]
      });
      
      const pi = i + 1;
      const leftId = ++nodeId; const rightId = ++nodeId;
      treeNodes[parentNode].children.push(leftId, rightId);
      
      const depth = Math.max(1, treeNodes[parentNode].y / 60);
      const spread = Math.max(160 / depth, 50);
      
      const leftLabel = low <= pi - 1 ? `L(${low}..${pi - 1})` : 'L(ø)';
      const rightLabel = pi + 1 <= high ? `R(${pi + 1}..${high})` : 'R(ø)';

      treeNodes.push({ id: leftId, label: leftLabel, x: treeNodes[parentNode].x - spread, y: treeNodes[parentNode].y + 60, children: [] });
      treeNodes.push({ id: rightId, label: rightLabel, x: treeNodes[parentNode].x + spread, y: treeNodes[parentNode].y + 60, children: [] });
      
      qs(low, pi - 1, leftId);
      qs(pi + 1, high, rightId);
    }
  }
  
  qs(0, a.length - 1, 0);
  steps.push({ 
    step: stepNum++, line: 15, variables: [], 
    explanation: 'Quick Sort complete!', whatIf: 'Average case O(N log N). Worst case O(N^2) if already sorted.', treeHighlight: [0],
    action: 'Done', phase: 'done', activeElements: [], array: [...a] 
  });
  return { steps, treeNodes, arrayData: a, algorithmType: 'quick-sort' };
}export function interpretHeapSort(arr?: number[]): InterpreterResult {
  const a = arr ? [...arr] : [4, 10, 3, 5, 1];
  const steps: ExecutionStep[] = [];
  let stepNum = 1;

  const pushStep = (
    active: number[], 
    highlighted: {index: number, role: any}[], 
    action: string, 
    phase: ExecutionStep['phase'] = 'compare'
  ) => {
    steps.push({
      step: stepNum++,
      line: 1, // Generic line for visualization focus
      variables: [],
      explanation: action,
      whatIf: '',
      activeElements: active,
      highlightedIndices: highlighted,
      array: [...a],
      treeHighlight: active,
      action,
      phase
    });
  };

  const treeNodes: TreeNode[] = [];
  for (let i = 0; i < a.length; i++) {
    const depth = Math.floor(Math.log2(i + 1));
    const offset = i - (Math.pow(2, depth) - 1);
    const width = 240 / Math.pow(2, depth);
    const x = 340 - (width * (Math.pow(2, depth) - 1)) / 2 + offset * width;
    treeNodes.push({
      id: i, label: `${i}`, x, y: 30 + depth * 60,
      children: [2*i + 1, 2*i + 2].filter(c => c < a.length)
    });
  }

  function heapify(n: number, i: number) {
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;

    if (l < n) {
      pushStep([i, l], [
        {index: i, role: 'mid'}, 
        {index: l, role: 'comparing'}
      ], `Compare parent ${a[i]} with left child ${a[l]}`);
      if (a[l] > a[largest]) largest = l;
    }

    if (r < n) {
      pushStep([largest, r], [
        {index: largest, role: 'mid'}, 
        {index: r, role: 'comparing'}
      ], `Compare largest ${a[largest]} with right child ${a[r]}`);
      if (a[r] > a[largest]) largest = r;
    }

    if (largest !== i) {
      pushStep([i, largest], [
        {index: i, role: 'swapping'}, 
        {index: largest, role: 'swapping'}
      ], `Swapping ${a[i]} and ${a[largest]}`, 'update');

      const t = a[i]; a[i] = a[largest]; a[largest] = t;

      pushStep([i, largest], [
        {index: i, role: 'swapping'}, 
        {index: largest, role: 'swapping'}
      ], `Swapped ${a[i]} and ${a[largest]}`, 'update');

      heapify(n, largest);
    }
  }

  // 1. Build Max Heap
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) {
    pushStep([i], [{index: i, role: 'mid'}], `Building heap: Heapify at index ${i}`, 'branch');
    heapify(a.length, i);
  }

  // 2. Extractions
  for (let i = a.length - 1; i > 0; i--) {
    pushStep([0, i], [
      {index: 0, role: 'swapping'}, 
      {index: i, role: 'swapping'}
    ], `Extracting max ${a[0]} to index ${i}`, 'update');

    const t = a[0]; a[0] = a[i]; a[i] = t;

    pushStep([i], [
      {index: i, role: 'found'}
    ], `Placed ${a[i]} at sorted position. Remaining heap size: ${i}`, 'done');

    heapify(i, 0);
  }

  pushStep([0], [{index: 0, role: 'found'}], 'Sorting complete!', 'done');

  return { steps, treeNodes, arrayData: a, algorithmType: 'heap-sort' };
}
