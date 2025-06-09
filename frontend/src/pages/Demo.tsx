// Updated Demo.tsx with original 3-panel UI layout
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, Code } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

export default function Demo() {
  const { user, session, loading: authLoading, error: authError, withValidSession, signOut } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [simulationData, setSimulationData] = useState<{ canvasHtml: string, jsCode: string } | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [rawResponse, setRawResponse] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const createSimulationDocument = (canvasHtml: string, jsCode: string): string => {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Simulation</title><style>body{margin:0;padding:20px;font-family:sans-serif;background:#fff}canvas{display:block;margin:0 auto;border:1px solid #ccc}</style></head><body>${canvasHtml}<script>setTimeout(()=>{try{${jsCode}}catch(e){document.body.innerHTML='<div class="error">'+e.message+'</div>'}},100)</script></body></html>`;
  };

  useEffect(() => {
    if (simulationData && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = createSimulationDocument(simulationData.canvasHtml, simulationData.jsCode);
      iframe.srcdoc = doc;
    }
  }, [simulationData]);

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSuggestion('');
    setRawResponse('');
    setSimulationData(null);

    try {
      await withValidSession(async () => {
        const response = await fetch("https://zurfhydnztcxlomdyqds.functions.supabase.co/simulate", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ prompt, subject }),
        });

        const data = await response.json();
        setRawResponse(JSON.stringify(data, null, 2));

        if (data.suggestion) return setSuggestion(data.suggestion);
        if (data.error) return setError(data.error);
        if (!data.canvasHtml || !data.jsCode) throw new Error('Missing data');

        setSimulationData({ canvasHtml: data.canvasHtml, jsCode: data.jsCode });
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading...</div>;
  if (authError || !user) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Authentication Error</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-16 flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 p-6 flex flex-col">
        <label className="text-sm mb-1">Subject</label>
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mb-4 bg-gray-700 rounded p-2">
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>

        <label className="text-sm mb-1">Prompt</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mb-4 h-24 bg-gray-700 rounded p-2" />

        <button onClick={runSimulation} disabled={loading || !prompt.trim()} className="bg-yellow-500 text-black rounded p-2 mb-2">
          {loading ? 'Running...' : 'Run Simulation'}
        </button>

        <div className="mt-auto">
          <label className="text-sm font-medium">Follow Up</label>
          <input type="text" disabled className="mt-1 w-full bg-gray-600 rounded p-2 text-sm" placeholder="Coming soon" />
        </div>
      </div>

      {/* Center Simulation Panel */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700 text-xl font-semibold">Simulation</div>
        <div className="flex-1 p-4">
          {error && <div className="mb-4 bg-red-500/10 p-4 rounded text-red-300">{error}</div>}
          {suggestion && <div className="mb-4 bg-yellow-500/10 p-4 rounded text-yellow-200">Try this: {suggestion}</div>}

          <div className="bg-white min-h-[400px] rounded overflow-hidden">
            {!simulationData && !loading && (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                Enter a prompt and click "Run Simulation" to get started
              </div>
            )}
            {loading && (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Generating...
              </div>
            )}
            {simulationData && (
              <iframe
                ref={iframeRef}
                className="w-full h-[400px] border-0"
                title="Simulation"
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </div>

        <div className="border-t border-gray-700 px-4 py-2">
          <button onClick={() => setShowConsole(!showConsole)} className="text-sm text-gray-300 hover:text-white flex items-center">
            <Code className="w-4 h-4 mr-2" /> {showConsole ? 'Hide Console' : 'Show Console'}
          </button>
          {showConsole && rawResponse && (
            <div className="mt-2 bg-gray-800 p-4 text-sm max-h-48 overflow-auto rounded">
              <pre>{rawResponse}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-gray-800 p-6 border-l border-gray-700">
        <div className="text-sm font-bold mb-2">Explanation</div>
        <div className="text-gray-400 text-sm">
          Run a simulation to see detailed explanations and insights.
        </div>
      </div>
    </div>
  );
}
