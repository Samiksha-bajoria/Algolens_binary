const GEMINI_API_KEY = 'AIzaSyA2tdreBy9gp7q4WimpkRxDLuIa2pc-wq4';

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
  if (cachedModelPath) return cachedModelPath;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  const models = data.models
    .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
    .map((m: any) => m.name); // returns "models/gemini-1.5-flash", etc.
    
  // Explicitly avoid gemini-*.pro as they have strict 0 or 2 RPM limits on free tier, prioritizing the 15 RPM 'flash' variants
  const validModels = models.filter((m: string) => !m.includes('pro'));

  // Prefer 2.5-flash, then 1.5-flash, then any flash, then whatever
  const preferred = validModels.find((m: string) => m.includes('2.5-flash'))
                 || validModels.find((m: string) => m.includes('1.5-flash')) 
                 || validModels.find((m: string) => m.includes('flash'))
                 || validModels[0] || 'models/gemini-1.5-flash';
                 
  if (!preferred) throw new Error("No valid generateContent models found for this API key.");
  cachedModelPath = preferred; // output format: 'models/gemini-1.5-flash'
  return preferred;
}

const architectureCache = new Map<string, any>();

export async function generateRepoArchitecture(treeData: any) {
  const cacheKey = JSON.stringify({t: treeData.tree?.length || 0, d: treeData.tree?.[0]?.path}).substring(0, 50);
  if (architectureCache.has(cacheKey)) return architectureCache.get(cacheKey);

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
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    })
  });
  
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  let text = data.candidates[0].content.parts[0].text;
  
  // Extract JSON payload safely
  let jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return a valid flowchart format.");
  
  try {
    let jsonContent = jsonMatch[0];
    jsonContent = jsonContent.replace(/^\s*\`\`\`json/m, '').replace(/\`\`\`\s*$/m, '');
    const parsed = JSON.parse(jsonContent);
    architectureCache.set(cacheKey, parsed);
    return parsed;
  } catch (e) {
    throw new Error("Failed to parse flowchart JSON from AI.");
  }
}

const summaryCache = new Map<string, any>();
export async function fetchFileSummary(repoUrl: string, filePath: string) {
  const cacheKey = `${repoUrl}::${filePath}`;
  if (summaryCache.has(cacheKey)) return summaryCache.get(cacheKey);

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
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  try {
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    summaryCache.set(cacheKey, parsed);
    return parsed;
  } catch (e) {
    return { summary: text, flowchart: null };
  }
}

export async function generateExecutionTrace(code: string, userArray?: number[]) {
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
      "arrayState": [1, 2, 3],
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
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0 }
    })
  });

  const data = await res.json();
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
    arrayState: s.arrayState || userArray || [],
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
  return parsed;
}

export async function generateFramerAnimationCode(code: string, ast: string): Promise<string> {
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
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });
    
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.replace(/```(?:tsx|jsx|js|javascript)?/g, '').replace(/```/g, '').trim();
  } catch (e) {
    console.error("Gemini Render Generator Error:", e);
    return "return () => <div className='text-red-500 font-mono'>API Exhausted. Please retry.</div>;";
  }
}
