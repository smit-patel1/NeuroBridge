import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, Code } from 'lucide-react';

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

export default function Demo() {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [simulationData, setSimulationData] = useState<{canvasHtml: string, jsCode: string} | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [rawResponse, setRawResponse] = useState('');
  const simulationRef = useRef<HTMLDivElement>(null);
  const animationFrameIds = useRef<number[]>([]);
  const timeoutIds = useRef<number[]>([]);

  // Comprehensive cleanup function
  const cleanupSimulation = () => {
    // Cancel all animation frames
    animationFrameIds.current.forEach(id => cancelAnimationFrame(id));
    animationFrameIds.current = [];
    
    // Clear all timeouts
    timeoutIds.current.forEach(id => clearTimeout(id));
    timeoutIds.current = [];
    
    // Remove simulation scripts
    document.querySelectorAll('script[data-simulation]').forEach(script => script.remove());
    
    // Clear simulation container
    if (simulationRef.current) {
      simulationRef.current.innerHTML = '';
    }
    
    // Force garbage collection hint
    if (window.gc) window.gc();
  };

  // Safe script execution with timeout protection
  const executeSimulationScript = (jsCode: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Set a maximum execution time (10 seconds)
      const timeoutId = setTimeout(() => {
        reject(new Error('Simulation script timed out after 10 seconds'));
      }, 10000);

      try {
        // Wrap user code with safety measures
        const safeCode = `
          (() => {
            try {
              // Override requestAnimationFrame to track IDs
              const originalRAF = window.requestAnimationFrame;
              window.requestAnimationFrame = function(callback) {
                const id = originalRAF.call(window, function(timestamp) {
                  try {
                    callback(timestamp);
                  } catch (error) {
                    console.error('Animation frame error:', error);
                    cancelAnimationFrame(id);
                  }
                });
                // Store the ID for cleanup (this would need to be accessible globally)
                if (window.simulationRAFIds) {
                  window.simulationRAFIds.push(id);
                } else {
                  window.simulationRAFIds = [id];
                }
                return id;
              };
              
              // User's simulation code
              ${jsCode}
              
            } catch (error) {
              console.error('Simulation execution error:', error);
              throw error;
            }
          })();
        `;

        const script = document.createElement('script');
        script.setAttribute('data-simulation', 'true');
        script.textContent = safeCode;
        
        script.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        
        script.onerror = (error) => {
          clearTimeout(timeoutId);
          reject(new Error(`Script loading failed: ${error}`));
        };

        document.head.appendChild(script);

      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  };

  // Execute simulation with comprehensive error handling
  useEffect(() => {
    if (simulationData && simulationRef.current) {
      cleanupSimulation();

      // Insert canvas HTML
      simulationRef.current.innerHTML = simulationData.canvasHtml;

      // Wait for DOM and execute script
      const timeoutId = setTimeout(async () => {
        try {
          // Verify canvas exists
          const canvas = simulationRef.current?.querySelector('canvas');
          if (!canvas) {
            throw new Error('Canvas element not found in simulation HTML');
          }

          // Initialize global RAF tracking
          (window as any).simulationRAFIds = [];

          await executeSimulationScript(simulationData.jsCode);
          console.log('✓ Simulation script executed successfully');
          
        } catch (scriptError) {
          console.error('Simulation execution failed:', scriptError);
          setError(`Simulation crashed: ${(scriptError as Error).message}`);
          cleanupSimulation();
        }
      }, 300);

      timeoutIds.current.push(timeoutId);
    }

    return cleanupSimulation;
  }, [simulationData]);

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSuggestion('');
    setSimulationData(null);
    setRawResponse('');
    cleanupSimulation();

    try {
      const response = await fetch("https://zurfhydnztcxlomdyqds.functions.supabase.co/simulate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, subject }),
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        setRawResponse(JSON.stringify(data, null, 2));
      } else {
        const textResponse = await response.text();
        throw new Error(`Invalid response format: ${textResponse.substring(0, 200)}...`);
      }

      if (!response.ok) {
        if (data?.suggestion) {
          setSuggestion(data.suggestion);
        } else if (data?.error) {
          setError(data.error || 'Simulation failed.');
        } else {
          setError(`Simulation failed with status ${response.status}`);
        }
        return;
      }

      if (data.canvasHtml && data.jsCode) {
        setSimulationData({
          canvasHtml: data.canvasHtml,
          jsCode: data.jsCode
        });
      } else {
        setError('Backend returned incomplete simulation data');
      }

    } catch (err: any) {
      console.error('Simulation request error:', err);
      setError(err.message || 'Failed to connect to simulation engine');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupSimulation();
      // Clean up global RAF IDs
      const rafIds = (window as any).simulationRAFIds || [];
      rafIds.forEach((id: number) => cancelAnimationFrame(id));
      delete (window as any).simulationRAFIds;
    };
  }, []);

  const resetSimulation = () => {
    cleanupSimulation();
    setError('');
    setSimulationData(null);
  };

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
            className="bg-yellow-500 text-black py-3 px-4 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Run Simulation
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
                    <div className="flex-1">
                      <div className="text-sm">{error}</div>
                      <button 
                        onClick={resetSimulation}
                        className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                      >
                        Reset Simulation
                      </button>
                    </div>
                  </div>
                )}

                <div 
                  ref={simulationRef}
                  className="bg-white rounded-lg p-4 min-h-[300px] flex items-center justify-center"
                >
                  {!simulationData && !loading && !error && (
                    <p className="text-gray-500">Enter a prompt and click "Run Simulation" to get started</p>
                  )}
                  {loading && (
                    <div className="flex items-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mr-3" />
                      Generating simulation...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
