const BACKEND_URL = 'http://localhost:3001';

const repoTreeCache = new Map<string, any>();

export async function fetchGithubTree(repoUrl: string) {
  if (repoTreeCache.has(repoUrl)) return repoTreeCache.get(repoUrl);
  
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL format. Use https://github.com/owner/repo");
  
  const owner = match[1];
  let repo = match[2];
  // Clean URL suffixes like trailing slashes, .git, or specific paths
  repo = repo.replace(/\.git$/, '').split(/[\/\?#]/)[0];

  // 1. Fetch metadata to handle default branches (like 'dev' or 'trunk') & intercept rate limiting
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoRes.ok) {
     if (repoRes.status === 403) throw new Error(`GitHub API Rate Limit exceeded for anonymous requests. Please try again later.`);
     if (repoRes.status === 404) throw new Error(`Repository ${owner}/${repo} not found or is private.`);
     throw new Error(`GitHub HTTP Error ${repoRes.status}: ${repoRes.statusText}`);
  }
  
  const repoInfo = await repoRes.json();
  const defaultBranch = repoInfo.default_branch || 'main';

  // 2. Fetch the actual recursive AST dictionary
  let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
  if (!res.ok) {
     throw new Error(`Could not fetch repository tree for ${owner}/${repo} on branch: ${defaultBranch}.`);
  }
  
  const treeData = await res.json();
  
  // Throttle absurdly huge repositories to protect memory mapping limits
  if (treeData?.tree?.length > 2500) {
    treeData.tree = treeData.tree.slice(0, 2500);
  }
  
  repoTreeCache.set(repoUrl, treeData);
  return treeData;
}

let cachedModelPath = '';

async function getAvailableModel(): Promise<string> {
  const cacheKey = 'gemini_model_path_cache';
  // SUCCESS: Verification showed 'gemini-flash-latest' works for this account
  const preferred = 'models/gemini-flash-latest';
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(cacheKey, preferred);
  }
  return preferred;
}

const architectureCache = new Map<string, any>();

const architectureCacheKey = (treeData: any) => {
  const meta = {t: treeData.tree?.length || 0, d: treeData.tree?.[0]?.path};
  return `gemini_arch_${JSON.stringify(meta).substring(0, 50)}`;
};

export async function generateRepoArchitecture(treeData: any) {
  const cacheKey = architectureCacheKey(treeData);
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const paths = treeData.tree
    .map((t: any) => t.path)
    .filter((p: string) => !p.startsWith('.') && !p.includes('node_modules') && !p.includes('dist') && !p.includes('build'));
    
  const prompt = `You are a legendary software architect. Analyze this repository file structure and generate a detailed, visually appealing architectural flowchart. 
Identify 6 to 10 key structural modules, grouping actual files and folders into logical components.
For the "role" field, concisely explain EXACTLY what files map to this module and what happens inside them (e.g. "ui/auth, db/schema -> Handles login and data storage").

Return EXACTLY a JSON file matching this schema:
{
  "modules": [
    { "id": "string", "name": "string", "role": "string", "color": "blue|green|purple|amber" }
  ],
  "edges": [
    { "source": "string", "target": "string" }
  ]
}

Files in Repo:
${paths.slice(0, 200).join('\\n')}
`;

  const modelPath = await getAvailableModel();
  const res = await fetch(`${BACKEND_URL}/api/gemini/${modelPath}/generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    })
  });
  
  const data = await res.json();
  if (res.status === 429) throw new Error("AI Quota Exceeded. Please wait 20s for the next request... (Free Tier limit: 15 requests per minute).");
  if (data.error) throw new Error(data.error.message);
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Robust JSON extraction
  let jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return a valid flowchart format. Try again.");
  
  try {
    let jsonContent = jsonMatch[0];
    // Strip markdown code blocks if they were captured by the greedy regex
    jsonContent = jsonContent.replace(/^\s*\`\`\`json/m, '').replace(/\`\`\`\s*$/m, '');
    const parsed = JSON.parse(jsonContent);
    if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(parsed));
    return parsed;
  } catch (e) {
    console.error("Gemini Architecture Parse Failure:", e, text);
    throw new Error("Failed to parse the AI architectural map. The Repo is likely too complex.");
  }
}

const summaryCacheKey = (url: string, path: string) => `geminisummary_${url}_${path}`;

export async function fetchFileSummary(repoUrl: string, filePath: string) {
  const cacheKey = summaryCacheKey(repoUrl, filePath);
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL");
  const [, owner, repo] = match;

  let code = "";
  try {
    let res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`);
    if (!res.ok) res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${filePath}`);
    if (res.ok) code = await res.text();
  } catch (e) {
    code = "Unable to fetch raw code content. It may be too large or binary.";
  }

  const prompt = `Analyze this file from the repository: ${filePath}

Source code:
\`\`\`
${code.slice(0, 3500)} // (truncated if long)
\`\`\`

Act as a legendary 10x Developer explaining this to a junior. Make the response VISUALLY STUNNING, HIGHLY ENGAGING, and NOT BORING. 
Use formatting tricks like:
- 🚀 **Emojis** for bullet points!
- 🎨 Beautiful markdown blockquotes for key takeaways!
- ⚡ Clear, punchy sections highlighting the 'Why' and the 'How'!

Return EXACTLY a JSON file matching this schema:
{
  "summary": "Your vibrant, high-energy markdown explanation here...",
  "flowchart": {
    "modules": [ { "id": "string", "name": "string", "role": "string", "color": "blue|green|purple|amber" } ],
    "edges": [ { "source": "string", "target": "string" } ]
  }
}

The 'flowchart' should act as a mini-architectural graphic of JUST the functions or logical steps inside this specific file! Do NOT wrap in generic markdown blocks, return ONLY parseable JSON.`;

  const modelPath = await getAvailableModel();
  const res = await fetch(`${BACKEND_URL}/api/gemini/${modelPath}/generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  
  const data = await res.json();
  if (res.status === 429) throw new Error("AI Quota Exceeded. Please wait 20s for the next request... (Free Tier limit: 15 requests per minute).");
  if (data.error) throw new Error(data.error.message);
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Robust JSON extraction
  let jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // If it's just raw text, provide a default object so the summary still renders
    return { summary: text, flowchart: null };
  }

  try {
    let jsonContent = jsonMatch[0];
    // Strip markdown code blocks if they were captured by the greedy regex
    jsonContent = jsonContent.replace(/^\s*\`\`\`json/m, '').replace(/\`\`\`\s*$/m, '');
    const parsed = JSON.parse(jsonContent);
    if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(parsed));
    return parsed;
  } catch (e) {
    console.error("Gemini Parse Failure:", e, text);
    return { summary: text, flowchart: null };
  }
}

export async function generateExecutionTrace(code: string, userArray?: number[]) {
  const keyObj = { c: code, a: userArray || [] };
  const cacheKey = `geminitrace_${JSON.stringify(keyObj)}`;
  
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const prompt = `Analyze this isolated JavaScript function and simulate its execution step-by-step. 
The input array is: [${userArray?.join(', ') || 'N/A'}]

Return a JSON object that strictly matches this interface. YOU MUST generate a valid execution tree with multiple nodes representing the flow of the program:
{
  "steps": [
    {
      "step": 1,
      "line": 2, 
      "variables": [{ "name": "i", "value": 0 }],
      "explanation": "Human readable explanation of this step.",
      "whatIf": "What if a different condition occurred?",
      "action": "Brief summary",
      "phase": "init", 
      "activeElements": [0], 
      "array": [1, 2, 3],
      "treeHighlight": [0, 1], // Indices of treeNodes active in this step
      "highlightedIndices": [{ "index": 0, "role": "comparing" }] // roles: comparing, swapping, found, low, high, mid
    }
  ],
  "treeNodes": [
    { "id": 0, "label": "Start", "x": 340, "y": 20, "children": [1] },
    { "id": 1, "label": "Step 1", "x": 340, "y": 80, "children": [2] },
    { "id": 2, "label": "Step 2", "x": 340, "y": 140, "children": [] }
  ],
  "algorithmType": "generic"
}
Ensure 'treeNodes' correctly maps the structural flow visually with properly spaced X and Y coordinates (Y should increase by 60 for each depth level).

Code:
\`\`\`javascript
${code}
\`\`\``;

  const modelPath = await getAvailableModel();
  const res = await fetch(`${BACKEND_URL}/api/gemini/${modelPath}/generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0 }
    })
  });

  const data = await res.json();
  if (res.status === 429) throw new Error("AI Quota Exceeded. Please wait 20s for the next request... (Free Tier limit: 15 requests per minute).");
  if (data.error) throw new Error(data.error.message);
  
  let text = data.candidates[0].content.parts[0].text;
  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    
    // Safety scrub for markdown blocks that leak into the JSON match
    text = text.replace(/^\s*\`\`\`json/m, '').replace(/\`\`\`\s*$/m, '');
    parsed = JSON.parse(text);
  } catch(e) {
    throw new Error("AI returned malformed abstract syntax trace graph.");
  }
  
  // ensure required defaults to prevent React map crashes (White Screen of Death)
  parsed.steps = (parsed.steps || []).map((s: any) => ({
    ...s,
    whatIf: s.whatIf || 'The AI execution path reached this state based on the input structure.',
    treeHighlight: s.treeHighlight || [0],
    activeElements: s.activeElements || [],
    array: s.array || userArray || [],
    variables: s.variables || [],
    highlightedIndices: s.highlightedIndices || []
  }));
  
  if (parsed.steps.length === 0) {
    parsed.steps = [{ step: 1, line: 1, variables: [], explanation: 'AI skipped steps.', action: 'End', phase: 'done', activeElements: [], whatIf: '', treeHighlight: [0] }];
  }
  let baseNodes = parsed.treeNodes && parsed.treeNodes.length > 0
    ? parsed.treeNodes
    : [{ id: 0, label: 'Start Flow', x: 340, y: 20, children: [] }];
    
  // Prevent SVG NaN DOM crash (White Screen of Death) when AI hallucinates coordinates
  parsed.treeNodes = baseNodes.map((n: any, i: number) => ({
    ...n,
    id: n.id ?? i,
    label: n.label || `Node ${i}`,
    x: typeof n.x === 'number' ? n.x : 340,
    y: typeof n.y === 'number' ? n.y : 20 + (i * 60),
    children: Array.isArray(n.children) ? n.children : []
  }));
    
  parsed.arrayData = userArray || [];
  if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(parsed));
  return parsed;
}

export async function generateFramerAnimationCode(code: string, ast: string): Promise<string> {
  const cacheKey = `geminiframer_${code.substring(0, 100)}_${ast.substring(0, 50)}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  }

  const prompt = `You are a world-class React and Framer Motion developer building an Animated Code Visualizer.
Given the following algorithm code and its Abstract Syntax Tree (AST), write a single React functional component that dynamically visually animates the execution of the code using framer-motion.

CRITICAL REQUIREMENTS:
1. Do NOT use any 'import' or 'export' statements.
2. You ALREADY have access to the global variables: \`React\`, \`useState\`, \`useEffect\`, \`motion\`, \`AnimatePresence\`. These are passed via closure.
3. The component must auto-play a step-by-step animation of what the provided code structurally calculates or represents. Try to make it large, centered, beautiful, and fluid.
4. Define your root component function securely and name it explicitly \`Visualizer\`. Do NOT write a top-level \`return\` statement or Babel will crash.
5. Output STRICTLY raw, valid, runnable JS/JSX only. Do NOT wrap inside markdown \`\`\`tsx tags.

Code to visualize:
${code}`;

  try {
    const modelPath = await getAvailableModel();
    const res = await fetch(`${BACKEND_URL}/api/gemini/${modelPath}/generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });
    
    const data = await res.json();
    if (res.status === 429 || data.quotaExceeded) {
      throw new Error("AI Quota Exceeded. Please wait 20s for the next request... (Free Tier limit: 15 requests per minute).");
    }
    if (data.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.message || 'AI Generation Failed');
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```(?:tsx|jsx|js|javascript)?/g, '').replace(/```/g, '').trim();
    
    if (typeof window !== 'undefined') localStorage.setItem(cacheKey, cleaned);
    return cleaned;
  } catch (e: any) {
    console.error("Gemini Render Generator Error:", e);
    const isNetwork = e instanceof TypeError || e.message?.includes('fetch') || e.message?.includes('Network');
    const msg = isNetwork 
      ? "Backend Server Offline. Please run 'npm run dev:all' to start the backend." 
      : (e.message || "API Quota Exhausted. (Try again in 20s)");
    const safeMsg = JSON.stringify(msg);
    
    return `const Visualizer = () => {
      const msg = ${safeMsg};
      return (
        <div className='flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-500/40 bg-red-500/5 rounded-2xl'>
          <div className='w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center mb-3'>
            <svg className='text-red-500 w-5 h-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/></svg>
          </div>
          <p className='text-xs font-mono text-red-400 font-bold mb-1 uppercase tracking-widest'>Error Detected</p>
          <p className='text-[13px] text-foreground/80 font-sans text-center max-w-sm'>{msg}</p>
        <button 
           onClick={() => window.location.reload()} 
           className='mt-4 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded text-[11px] font-mono text-white transition-all'
        >
           Retry Refresh
        </button>
      </div>
    );
    };`;
  }
}
