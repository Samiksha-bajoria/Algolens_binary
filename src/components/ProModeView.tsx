import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchGithubTree, generateRepoArchitecture, fetchFileSummary } from '@/lib/geminiService';
import { Github, Play, FileCode, Workflow, ChevronRight, ChevronDown, Activity, Terminal } from 'lucide-react';

interface RepoNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: RepoNode[];
  summary?: string;
}

const buildHierarchicalTree = (paths: string[]): RepoNode[] => {
  const root: RepoNode[] = [];
  paths.forEach(pathStr => {
    const parts = pathStr.split('/');
    let currentLevel = root;
    parts.forEach((part, i) => {
      let existing = currentLevel.find(n => n.name === part);
      if (!existing) {
        existing = {
          id: pathStr,
          name: part,
          type: i === parts.length - 1 ? 'file' : 'folder',
          children: i === parts.length - 1 ? undefined : []
        };
        currentLevel.push(existing);
      }
      if (existing.children) currentLevel = existing.children;
    });
  });
  return root;
};

const ProModeView = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/expressjs/express');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [selectedFile, setSelectedFile] = useState<RepoNode | null>(null);
  
  // Real data state
  const [repoTree, setRepoTree] = useState<RepoNode[]>([]);
  const [architecture, setArchitecture] = useState<any>(null);
  const [fileSummary, setFileSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setHasData(false);
    setSelectedFile(null);
    setErrorStatus('');
    setExpandedFolders(new Set());
    
    try {
      // 1. Fetch Github Tree
      const treeRes = await fetchGithubTree(repoUrl);
      const paths = treeRes.tree.map((t: any) => t.path).filter((p: string) => !p.startsWith('.git'));
      setRepoTree(buildHierarchicalTree(paths));

      // 2. Generate Gemini Flowchart
      const arch = await generateRepoArchitecture(treeRes);
      setArchitecture(arch);
      
      setHasData(true);
    } catch (e: any) {
      setErrorStatus(e.message || 'Unknown error occurred.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!selectedFile || selectedFile.type === 'folder') return;
    setIsLoadingSummary(true);
    fetchFileSummary(repoUrl, selectedFile.id)
      .then(result => setFileSummary(result))
      .catch((e) => setFileSummary({ summary: 'Error generating summary.' }))
      .finally(() => setIsLoadingSummary(false));
  }, [selectedFile, repoUrl]);

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const renderSidebarTree = (nodes: RepoNode[], depth = 0) => {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.id);
      return (
        <div key={node.id} className="flex flex-col relative">
          <button
            onClick={() => node.type === 'folder' ? toggleFolder(node.id) : setSelectedFile(node)}
            className={`flex items-center gap-1.5 py-1 px-2 text-[11px] font-mono rounded hover:bg-primary/10 transition-colors ${
              selectedFile?.id === node.id ? 'bg-primary/20 text-primary border-l-2 border-primary' : 'text-muted-foreground'
            } ${node.type === 'folder' ? 'font-bold text-foreground/90 mt-1' : ''}`}
            style={{ paddingLeft: `${depth * 10 + 8}px` }}
          >
            {node.type === 'folder' ? (
              isExpanded ? <ChevronDown size={14} className="text-primary/70 shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground/60 shrink-0" />
            ) : (
              <FileCode size={12} className="opacity-40 ml-1 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </button>
          
          <AnimatePresence>
            {node.children && isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative">
                  <div className="absolute top-0 bottom-0 w-px bg-border/40" style={{ left: `${depth * 10 + 13}px` }} />
                  {renderSidebarTree(node.children, depth + 1)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto min-h-[800px] bg-background">
      {/* Search Bar Area */}
      <div className="p-6 border-b border-border/40 flex flex-col items-center justify-center bg-card/10 shrink-0">
        <div className="w-full max-w-2xl flex items-center gap-3">
          <div className="relative flex-1">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
            <input
              type="text"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              placeholder="Paste GitHub Repository URL (e.g. https://github.com/user/repo)"
              className="w-full bg-muted/30 border border-border/50 rounded-lg pl-9 pr-4 py-2.5 text-sm font-mono outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !repoUrl}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon-purple/20 border border-neon-purple/40 text-neon-purple text-sm font-mono font-semibold hover:bg-neon-purple/30 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Activity size={16} />
              </motion.div>
            ) : (
              <Workflow size={16} />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Architecture'}
          </button>
        </div>
        {isAnalyzing && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] text-muted-foreground/60 font-mono mt-3"
          >
            Querying Gemini API to summarize AST and repository flow...
          </motion.p>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[600px]">
        <AnimatePresence mode="wait">
          {!hasData && !isAnalyzing && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40"
            >
              
              <Workflow size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-mono text-center max-w-sm">
                Enter a repository URL to generate a dynamic architecture flowchart and code summaries using AI.
              </p>
            </motion.div>
          )}

          {isAnalyzing && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl border-2 border-primary/20 animate-spin" />
                <div className="absolute inset-0 border-t-2 border-primary rounded-2xl animate-spin" style={{ animationDuration: '1s' }} />
                <Workflow className="absolute inset-0 m-auto text-primary animate-pulse" size={24} />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-neon-purple font-mono text-sm tracking-wider animate-pulse">Running AI Repo Analysis...</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/50 font-mono">
                  <span>Calling Gemini 1.5 API</span>
                  <span className="flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span><span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span></span>
                </div>
              </div>
            </motion.div>
          )}

          {errorStatus && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 text-red-400"
            >
              <Terminal size={32} />
              <p className="text-sm font-mono">{errorStatus}</p>
            </motion.div>
          )}

          {!errorStatus && hasData && !isAnalyzing && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex h-full"
            >
              {/* Sidebar */}
              <div className="w-64 border border-border/40 m-4 rounded-xl p-4 flex flex-col gap-2 bg-card/20">
                <h3 className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Repository Structure
                </h3>
                {renderSidebarTree(repoTree)}
              </div>

              {/* Main Architecture/Summary Canvas */}
              <div className="flex-1 m-4 ml-0 border border-border/40 rounded-xl p-6 relative bg-grid-white/[0.02] flex flex-col min-h-[500px]">
                <h2 className="text-sm font-mono font-semibold mb-6 flex items-center gap-2 border-b border-border/40 pb-4">
                  <Terminal size={14} className="text-primary" />
                  {selectedFile ? `Analyzing: ${selectedFile.name}` : 'Global Architecture Flow'}
                </h2>
                
                <div className={`transition-all duration-500 ease-in-out w-full flex items-center justify-center relative ${selectedFile ? 'h-[250px] opacity-60 scale-95 overflow-hidden' : 'flex-1 p-8'}`}>
                  {/* Dynamic AI Flowchart */}
                  <div className="flex flex-wrap items-center justify-center gap-12 max-w-3xl transform origin-top">
                    {architecture?.modules?.map((mod: any, i: number) => {
                      const colors: any = {
                        blue: 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,184,217,0.2)]',
                        green: 'border-green-500/40 bg-green-500/10 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]',
                        purple: 'border-neon-purple/40 bg-neon-purple/10 text-neon-purple shadow-[0_0_15px_rgba(182,36,255,0.2)]',
                        amber: 'border-amber-500/40 bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
                      };
                      const cCls = colors[mod.color] || colors.blue;
                      
                      // Find edges targeting this module
                      const dependencies = architecture?.edges
                        ?.filter((e: any) => e.target === mod.id)
                        ?.map((e: any) => architecture.modules.find((m: any) => m.id === e.source)?.name)
                        .filter(Boolean) || [];
                      
                      return (
                        <div key={mod.id} className="relative flex flex-col items-center">
                          {dependencies.length > 0 && (
                            <div className="absolute -top-6 text-[8px] font-mono text-muted-foreground/60 whitespace-nowrap flex flex-col items-center">
                              <span>↓ from {dependencies.join(', ')}</span>
                              <div className="h-4 w-px bg-border/40 mt-1" />
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`w-64 min-h-[144px] border rounded-xl flex flex-col items-center justify-center text-center p-4 hover:-translate-y-1 transition-all cursor-pointer ${cCls}`}
                          >
                            <span className="text-[13px] font-bold font-mono text-foreground mb-2">{mod.name}</span>
                            <span className="text-[10px] font-sans opacity-90 leading-relaxed text-balance break-words">{mod.role}</span>
                          </motion.div>
                          <div className="absolute -bottom-6 w-px h-6 bg-border/40" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Gemini Summary Panel (appears below flowchart when file selected) */}
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex-1 border border-primary/20 bg-primary/5 rounded-xl p-6 relative shadow-[0_0_30px_rgba(var(--primary),0.05)] overflow-y-auto mt-4"
                  >
                    <div className="absolute top-4 right-4 text-[10px] px-2 py-1 rounded-full border border-primary/30 text-primary font-mono bg-primary/10">Gemini Summary</div>
                    {isLoadingSummary ? (
                      <div className="flex items-center gap-2 mt-4 text-sm font-mono text-muted-foreground">
                        <div className="w-4 h-4 rounded-full border border-primary border-t-transparent animate-spin" /> 
                        Analyzing raw code for {selectedFile.name}...
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="text-sm font-sans text-foreground/80 whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">
                          {fileSummary?.summary || 'No summary generated.'}
                        </div>
                        
                        {/* Mini Flowchart below summary */}
                        {fileSummary?.flowchart && fileSummary.flowchart.modules && (
                          <div className="mt-8 border-t border-border/20 pt-8">
                            <h4 className="text-xs font-mono font-semibold text-primary/80 mb-6 uppercase tracking-wider text-center">Internal File Logic Architecture</h4>
                            <div className="flex flex-wrap gap-6 justify-center pb-8 relative">
                              {fileSummary.flowchart.modules.map((mod: any, i: number) => {
                                const colors: any = {
                                  blue: 'border-primary/40 bg-primary/10 text-primary',
                                  green: 'border-green-500/40 bg-green-500/10 text-green-500',
                                  purple: 'border-neon-purple/40 bg-neon-purple/10 text-neon-purple',
                                  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-500',
                                };
                                const cCls = colors[mod.color] || colors.blue;
                                
                                const dependencies = fileSummary.flowchart.edges
                                  ?.filter((e: any) => e.target === mod.id)
                                  ?.map((e: any) => fileSummary.flowchart.modules.find((m: any) => m.id === e.source)?.name)
                                  .filter(Boolean) || [];
                                  
                                return (
                                  <div key={mod.id} className="relative flex flex-col items-center">
                                    {dependencies.length > 0 && (
                                      <div className="absolute -top-5 text-[8px] font-mono text-muted-foreground/60 whitespace-nowrap flex flex-col items-center">
                                        <span>↓ from {dependencies.join(', ')}</span>
                                        <div className="h-4 w-px bg-border/40 mt-0.5" />
                                      </div>
                                    )}
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.9 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: i * 0.1 }}
                                      className={`w-40 h-24 border rounded-xl flex flex-col items-center justify-center text-center p-2 hover:-translate-y-1 transition-all ${cCls}`}
                                    >
                                      <span className="text-xs font-bold font-mono text-foreground mb-1 leading-tight text-balance">{mod.name}</span>
                                      <span className="text-[9px] font-sans opacity-80 leading-tight text-balance">{mod.role}</span>
                                    </motion.div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProModeView;
