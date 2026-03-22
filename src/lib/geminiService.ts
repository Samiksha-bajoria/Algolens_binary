import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const repoTreeCache = new Map<string, any>();

// Fallback list of models if discovery fails
const STATIC_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-pro',
  'gemini-1.5-pro'
];

let discoveredModels: string[] = [];
let bestDiscoveryModel: string | null = null;
let lastRequestTime = 0;
const MIN_REQUEST_GAP = 2000;

async function throttleAI() {
  const now = Date.now();
  const diff = now - lastRequestTime;
  if (diff < MIN_REQUEST_GAP) {
    const wait = MIN_REQUEST_GAP - diff;
    await new Promise(r => setTimeout(r, wait));
  }
  lastRequestTime = Date.now();
}

/**
 * Dynamically queries the Gemini API for supported models
 */
async function discoverModels(): Promise<string[]> {
  if (discoveredModels.length > 0) return discoveredModels;

  // Use the API key as part of the cache identifier
  const cacheKey = `gemini_models_${GEMINI_API_KEY.slice(-8)}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      discoveredModels = JSON.parse(cached);
      return discoveredModels;
    }
  }

  console.log("[Gemini] Discovering available models for API Key...");
  const versions = ['v1beta', 'v1'];

  for (const v of versions) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${v}/models?key=${GEMINI_API_KEY}`);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.models) {
        const supported = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''));

        if (supported.length > 0) {
          console.log(`[Gemini] Discovered ${supported.length} models via ${v}:`, supported);
          discoveredModels = supported;
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify(supported));
          }
          return supported;
        }
      }
    } catch (e) { /* silent */ }
  }

  return [];
}

async function getPrioritizedModels(): Promise<string[]> {
  const discovered = await discoverModels();
  if (discovered.length === 0) return STATIC_MODELS;

  // Sort discovered models to prioritize Flash > Pro
  const preferred = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.5-pro'];
  const sorted = [...discovered].sort((a, b) => {
    const aIdx = preferred.findIndex(p => a.includes(p));
    const bIdx = preferred.findIndex(p => b.includes(p));
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return sorted;
}

async function generateWithFallback(prompt: string, temperature = 0.2): Promise<string> {
  await throttleAI();
  const models = await getPrioritizedModels();
  let lastError: any = null;

  // Try v1beta first as it's the most common for the SDK
  const versions = ['v1beta', 'v1'];

  for (const version of versions) {
    for (const modelName of models) {
      try {
        console.log(`[Gemini] Attempting ${modelName} @ ${version}`);
        const model = genAI.getGenerativeModel(
          { model: modelName, generationConfig: { temperature } },
          { apiVersion: version as any }
        );
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text) return text;
      } catch (e: any) {
        lastError = e;
        const msg = e.message || '';

        // Final fallback to 429 error if quota hit
        if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
          throw new Error("AI Quota Exceeded. Please wait 30s.");
        }

        // For 404 or other errors, continue to find a working combination
        continue;
      }
    }
  }

  throw new Error(lastError?.message || "Gemini AI failed to respond. Check API key or use a different model.");
}

export async function fetchGithubTree(repoUrl: string) {
  if (repoTreeCache.has(repoUrl)) return repoTreeCache.get(repoUrl);
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL format.");

  const owner = match[1];
  let repo = match[2].replace(/\.git$/, '').split(/[\/\?#]/)[0];

  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  if (!repoRes.ok) throw new Error(`GitHub Error ${repoRes.status}`);

  const repoInfo = await repoRes.json();
  const defaultBranch = repoInfo.default_branch || 'main';

  let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
  if (!res.ok) throw new Error(`Could not fetch tree.`);

  const treeData = await res.json();
  if (treeData?.tree?.length > 2500) treeData.tree = treeData.tree.slice(0, 2500);

  repoTreeCache.set(repoUrl, treeData);
  return treeData;
}

export async function generateRepoArchitecture(treeData: any) {
  const meta = { t: treeData.tree?.length || 0, d: treeData.tree?.[0]?.path };
  const cacheKey = `gemini_arch_${JSON.stringify(meta).substring(0, 50)}`;

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const paths = treeData.tree
    .map((t: any) => t.path)
    .filter((p: string) => !p.startsWith('.') && !p.includes('node_modules') && !p.includes('dist') && !p.includes('build'));

  const prompt = `You are a software architect. Analyze these files and return a JSON architectural flowchart:
{
  "modules": [{ "id": "string", "name": "string", "role": "string", "color": "blue|green|purple|amber" }],
  "edges": [{ "source": "string", "target": "string" }]
}
Files:
${paths.slice(0, 200).join('\\n')}`;

  try {
    const text = await generateWithFallback(prompt, 0.1);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response was not a valid architectural map.");
    const parsed = JSON.parse(jsonMatch[0].replace(/^\s*\`\`\`json/m, '').replace(/\`\`\`\s*$/m, ''));
    if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(parsed));
    return parsed;
  } catch (e: any) {
    throw e;
  }
}

export async function fetchFileSummary(repoUrl: string, filePath: string) {
  const cacheKey = `geminisummary_${repoUrl}_${filePath}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid URL");
  const [, owner, repo] = match;

  let code = "";
  try {
    let res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`);
    if (!res.ok) res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${filePath}`);
    if (res.ok) code = await res.text();
  } catch (e) { code = "Code not available."; }

  const prompt = `Analyze file: ${filePath}\nCode:\n${code.slice(0, 3000)}\nReturn JSON: { "summary": "markdown", "flowchart": { ... } }`;

  try {
    const text = await generateWithFallback(prompt, 0.2);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { summary: text, flowchart: null };
    const parsed = JSON.parse(jsonMatch[0].replace(/^\s*\`\`\`json/m, '').replace(/\`\`\`\s*$/m, ''));
    if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(parsed));
    return parsed;
  } catch (e: any) {
    return { summary: "Error generating summary.", flowchart: null };
  }
}

export async function generateExecutionTrace(code: string, userArray?: number[]) {
  const keyObj = { c: code, a: userArray || [] };
  const cacheKey = `geminitrace_${JSON.stringify(keyObj)}`;
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const prompt = `Trace JavasScript execution of this function. Input: [${userArray?.join(', ')}]\nReturn JSON steps and treeNodes.\nCode:\n${code}`;

  try {
    const text = await generateWithFallback(prompt, 0);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid trace.");
    const parsed = JSON.parse(jsonMatch[0].replace(/^\s*\`\`\`json/m, '').replace(/\`\`\`\s*$/m, ''));

    parsed.steps = (parsed.steps || []).map((s: any) => ({
      ...s,
      treeHighlight: s.treeHighlight || [0],
      activeElements: s.activeElements || [],
      array: s.array || userArray || [],
      variables: s.variables || [],
      highlightedIndices: s.highlightedIndices || []
    }));

    if (typeof window !== 'undefined') localStorage.setItem(cacheKey, JSON.stringify(parsed));
    return parsed;
  } catch (e: any) { throw e; }
}

export async function generateFramerAnimationCode(code: string, ast: string): Promise<string> {
  const prompt = `Write a React component 'Visualizer' using framer-motion to animate:\n${code}`;
  try {
    const text = await generateWithFallback(prompt, 0.4);
    return text.replace(/```(?:tsx|jsx|js|javascript)?/g, '').replace(/```/g, '').trim();
  } catch (e: any) {
    return `const Visualizer = () => <div>Error</div>;`;
  }
}
