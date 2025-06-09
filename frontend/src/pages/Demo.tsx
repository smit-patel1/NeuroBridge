// Demo.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, Code } from 'lucide-react';
import { useAuth } from "../hooks/useAuth";

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

export default function Demo() {
  const { user, session, loading: authLoading, error: authError, withValidSession, signOut } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [simulationData, setSimulationData] = useState<{canvasHtml: string, jsCode: string} | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [rawResponse, setRawResponse] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Create isolated simulation in iframe
  const createSimulationDocument = (canvasHtml: string, jsCode: string): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Simulation</title>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: Arial, sans-serif;
            background: #f8f9fa;
          }
          canvas { 
            display: block; 
            margin: 0 auto;
            border: 1px solid #ddd;
            background: white;
          }
          .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin: 20px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        ${canvasHtml}
        
        <script>
          window.onerror = function(message, source, lineno, colno, error) {
            console.error('Simulation Error:', message, error);
            document.body.innerHTML = '<div class="error"><h3>Simulation Error</h3><p>' + message + '</p></div>';
            return true;
          };
          
          setTimeout(function() {
            try {
              ${jsCode}
            } catch (error) {
              console.error('Script execution error:', error);
              document.body.innerHTML = '<div class="error"><h3>Script Error</h3><p>' + error.message + '</p></div>';
            }
          }, 100);
        </script>
      </body>
      </html>
    `;
  };

  // Load simulation into iframe
  useEffect(() => {
    if (simulationData && iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const doc = createSimulationDocument(simulationData.canvasHtml, simulationData.jsCode);
        iframe.srcdoc = doc;
        
        iframe.onload = () => {
          console.log('Simulation loaded successfully');
        };
        
        iframe.onerror = (error) => {
          console.error('Iframe loading error:', error);
          setError('Failed to load simulation');
        };
        
      } catch (error) {
        console.error('Simulation creation error:', error);
        setError(`Simulation creation failed: ${(error as Error).message}`);
      }
    }
  }, [simulationData]);

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSuggestion('');
    setRawResponse('');
    setSimulationData(null);

    try {
      // Use withValidSession to ensure we have a valid session
      await withValidSession(async () => {
        const response = await fetch("https://zurfhydnztcxlomdyqds.functions.supabase.co/simulate", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ prompt, subject }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          throw new Error(`Invalid response format: ${textResponse.substring(0, 200)}...`);
        }

        const data = await response.json();
        setRawResponse(JSON.stringify(data, null, 2));

        if (data.suggestion) {
          setSuggestion(data.suggestion);
          return;
        }

        if (data.error) {
          setError(data.error);
          return;
        }

        if (!data.canvasHtml || !data.jsCode) {
          throw new Error('Incomplete simulation data received from server');
        }

        console.log('Valid simulation data received');
        setSimulationData({
          canvasHtml: data.canvasHtml,
          jsCode: data.jsCode
        });
      });

    } catch (err) {
      console.error('Simulation request error:', err);
      setError((err as Error).message || 'Failed to generate simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setSimulationData(null);
      setError('');
      setRawResponse('');
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    }
  };

  const resetSimulation = () => {
    setSimulationData(null);
    setError('');
    if (iframeRef.current) {
      iframeRef.current.srcdoc = '';
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center text-white">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          Initializing authentication...
        </div>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200">
          <AlertCircle className="w-5 h-5 mr-2 inline" />
          Authentication Error: {authError}
        </div>
      </div>
    );
  }

  // Show login if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl mb-4">Please log in to continue</h1>
          {/* Add your login component here */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 p-6 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">Simulation Prompt</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg py-2 px-3 appearance-none cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex-grow mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to simulate..."
              className="w-full h-48 bg-gray-700 text-white rounded-lg p-3 resize-none"
            />
          </div>

          <button
            onClick={runSimulation}
            disabled={loading || !prompt.trim()}
            className="bg-yellow-500 text-black py-3 px-4 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Run Simulation
          </button>

          {simulationData && (
            <button
              onClick={resetSimulation}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 mb-2"
            >
              Reset Simulation
            </button>
          )}

          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-gray-800 rounded-lg h-full flex flex-col">
              <div className="border-b border-gray-700 p-4">
                <h2 className="text-xl font-bold text-white">Simulation</h2>
              </div>

              <div className="flex-1 p-4 overflow-auto">
                {suggestion && (
                  <div className="mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-200 flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Prompt unclear</p>
                      <p>Try this: {suggestion}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200 flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">{error}</div>
                  </div>
                )}

                {/* Simulation Container */}
                <div className="bg-white rounded-lg overflow-hidden min-h-[400px]">
                  {!simulationData && !loading && !error && (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      Enter a prompt and click "Run Simulation" to get started
                    </div>
                  )}
                  
                  {loading && (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mr-3" />
                      Generating simulation...
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
            </div>
          </div>

          {/* Console Panel */}
          <div className="border-t border-gray-700">
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <Code className="w-4 h-4 mr-2" />
              {showConsole ? 'Hide' : 'Show'} Response Console
            </button>

            {showConsole && rawResponse && (
              <div className="p-4 bg-gray-800 max-h-48 overflow-auto">
                <pre className="text-gray-300 text-sm">{rawResponse}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
