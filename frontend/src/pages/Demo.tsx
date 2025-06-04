import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, Code } from 'lucide-react';

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

// Error Boundary Component to catch React crashes
class SimulationErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200">
          <AlertCircle className="w-5 h-5 mr-2 inline" />
          <span>App crashed: {this.state.error?.message}</span>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="ml-2 px-2 py-1 bg-red-600 rounded text-sm hover:bg-red-700"
          >
            Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  // Global error handler to catch script errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(`Script error: ${event.message}`);
      return true; // Prevent default browser error handling
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setError(`Promise rejection: ${event.reason}`);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Comprehensive cleanup function
  const cleanupSimulation = () => {
    try {
      // Remove all simulation scripts
      document.querySelectorAll('script[data-simulation]').forEach(script => {
        script.remove();
      });

      // Clear simulation container
      if (simulationRef.current) {
        simulationRef.current.innerHTML = '';
      }

      // Cancel any animation frames
      if ((window as any).__simulationRAFIds) {
        (window as any).__simulationRAFIds.forEach((id: number) => {
          cancelAnimationFrame(id);
        });
        delete (window as any).__simulationRAFIds;
      }
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }
  };

  // Safe script execution with comprehensive error handling
  const executeSimulationScript = async (jsCode: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Wrap the user's code in comprehensive error handling
        const safeCode = `
          (function() {
            try {
              // Store original console.error to restore later
              const originalConsoleError = console.error;
              
              // Override console.error to catch script errors
              console.error = function(...args) {
                originalConsoleError.apply(console, args);
                if (args[0] && args[0].toString().includes('canvas')) {
                  throw new Error('Canvas error: ' + args[0]);
                }
              };

              // Initialize RAF tracking
              if (!window.__simulationRAFIds) {
                window.__simulationRAFIds = [];
              }

              // Override requestAnimationFrame to track IDs
              const originalRAF = window.requestAnimationFrame;
              window.requestAnimationFrame = function(callback) {
                const id = originalRAF.call(window, function(timestamp) {
                  try {
                    callback(timestamp);
                  } catch (error) {
                    console.error('Animation frame error:', error);
                    cancelAnimationFrame(id);
                    throw error;
                  }
                });
                window.__simulationRAFIds.push(id);
                return id;
              };

              // Execute user code with timeout
              const timeoutId = setTimeout(() => {
                throw new Error('Simulation script timed out');
              }, 5000);

              ${jsCode}

              clearTimeout(timeoutId);
              
              // Restore original console.error
              console.error = originalConsoleError;
              
            } catch (error) {
              console.error('Simulation execution error:', error);
              throw error;
            }
          })();
        `;

        const script = document.createElement('script');
        script.setAttribute('data-simulation', 'true');
        script.textContent = safeCode;
        
        script.onerror = (error) => {
          reject(new Error(`Script loading failed: ${error}`));
        };

        script.onload = () => resolve();

        // Add to head instead of body for better error handling
        document.head.appendChild(script);

      } catch (error) {
        reject(error);
      }
    });
  };

  // Execute simulation with error boundaries
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (simulationData && simulationRef.current) {
      const executeSimulation = async () => {
        try {
          // Clean up first
          cleanupSimulation();

          // Insert canvas HTML
          simulationRef.current!.innerHTML = simulationData.canvasHtml;

          // Wait for DOM to be ready
          await new Promise(resolve => setTimeout(resolve, 200));

          // Verify canvas exists
          const canvas = simulationRef.current?.querySelector('canvas');
          if (!canvas) {
            throw new Error('Canvas element not found in simulation HTML');
          }

          // Execute script safely
          await executeSimulationScript(simulationData.jsCode);
          console.log('✓ Simulation executed successfully');

        } catch (scriptError) {
          console.error('Simulation failed:', scriptError);
          setError(`Simulation failed: ${(scriptError as Error).message}`);
          
          // Show error in simulation area instead of crashing
          if (simulationRef.current) {
            simulationRef.current.innerHTML = `
              <div style="color: #dc3545; text-align: center; padding: 20px; font-family: Arial, sans-serif;">
                <h3>Simulation Error</h3>
                <p>${(scriptError as Error).message}</p>
                <small>Check console for details</small>
              </div>
            `;
          }
        }
      };

      timeoutId = setTimeout(executeSimulation, 100);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      cleanupSimulation();
    };
  }, [simulationData]);

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSuggestion('');
    setRawResponse('');
    
    // Clean up before starting
    cleanupSimulation();
    setSimulationData(null);

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
        setError('Invalid simulation data received');
      }

    } catch (err: any) {
      console.error('Request error:', err);
      setError(err.message || 'Failed to connect to simulation engine');
    } finally {
      setLoading(false);
    }
  };

  const handleErrorBoundaryError = (error: Error) => {
    setError(`App crashed: ${error.message}`);
    cleanupSimulation();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupSimulation();
  }, []);

  return (
    <SimulationErrorBoundary onError={handleErrorBoundaryError}>
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
                      <div className="text-sm">{error}</div>
                    </div>
                  )}

                  {/* Simulation Container */}
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
    </SimulationErrorBoundary>
  );
}
