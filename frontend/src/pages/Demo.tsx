import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, Code } from 'lucide-react';

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

export default function Demo() {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(subjects[0]); // FIX: Was using entire array instead of first element
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [simulationData, setSimulationData] = useState<{canvasHtml: string, jsCode: string} | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [rawResponse, setRawResponse] = useState('');
  const simulationRef = useRef<HTMLDivElement>(null);
  const animationFrameIds = useRef<number[]>([]);

  // Comprehensive cleanup function
  const cleanupSimulation = () => {
    // Cancel all animation frames to stop previous animations
    animationFrameIds.current.forEach(id => {
      try {
        cancelAnimationFrame(id);
      } catch (e) {
        console.warn('Error canceling animation frame:', e);
      }
    });
    animationFrameIds.current = [];

    // Remove all simulation scripts
    document.querySelectorAll('script[data-simulation]').forEach(script => {
      try {
        script.remove();
      } catch (e) {
        console.warn('Error removing script:', e);
      }
    });

    // Clear simulation container completely
    if (simulationRef.current) {
      simulationRef.current.innerHTML = '';
      // Force re-render by resetting styles
      simulationRef.current.style.display = 'none';
      simulationRef.current.offsetHeight; // Trigger reflow
      simulationRef.current.style.display = '';
    }

    // Clear any global variables that simulations might have created
    if (window.animationId) {
      cancelAnimationFrame(window.animationId);
      delete window.animationId;
    }
  };

  // Enhanced script execution with proper cleanup tracking
  const executeSimulationScript = (jsCode: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Wrap the code to track animation frames
        const wrappedCode = `
          (function() {
            // Override requestAnimationFrame to track all animation IDs
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = function(callback) {
              const id = originalRAF.call(window, function(timestamp) {
                try {
                  callback(timestamp);
                } catch (error) {
                  console.error('Animation callback error:', error);
                  cancelAnimationFrame(id);
                }
              });
              
              // Store animation frame ID for cleanup
              if (!window.__simulationRAFIds) {
                window.__simulationRAFIds = [];
              }
              window.__simulationRAFIds.push(id);
              
              return id;
            };

            try {
              ${jsCode}
            } catch (error) {
              console.error('Simulation script execution error:', error);
              throw error;
            }
          })();
        `;

        const script = document.createElement('script');
        script.setAttribute('data-simulation', 'true');
        script.textContent = wrappedCode;
        
        script.onload = () => resolve();
        script.onerror = (error) => {
          console.error('Script injection error:', error);
          reject(new Error('Failed to execute simulation script'));
        };

        document.head.appendChild(script);

      } catch (error) {
        reject(error);
      }
    });
  };

  // Execute simulation with proper timing and error handling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (simulationData && simulationRef.current) {
      // Clean up any existing simulation first
      cleanupSimulation();

      // Reset simulation container styles
      const container = simulationRef.current;
      container.style.background = '#ffffff';
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';

      // Insert canvas HTML
      container.innerHTML = simulationData.canvasHtml;

      // Wait for DOM to be ready, then execute script
      timeoutId = setTimeout(async () => {
        try {
          // Verify canvas exists and is ready
          const canvas = container.querySelector('canvas');
          if (!canvas) {
            throw new Error('Canvas element not found after DOM insertion');
          }

          // Ensure canvas is visible and has dimensions
          if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
            console.warn('Canvas has zero dimensions, waiting...');
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Clear any global RAF tracking array
          if (window.__simulationRAFIds) {
            window.__simulationRAFIds.forEach((id: number) => cancelAnimationFrame(id));
            delete window.__simulationRAFIds;
          }

          // Execute the simulation script
          await executeSimulationScript(simulationData.jsCode);
          console.log('✓ Simulation executed successfully');

        } catch (scriptError) {
          console.error('Simulation execution failed:', scriptError);
          setError(`Simulation failed: ${(scriptError as Error).message}`);
          
          // Show error in the canvas area
          if (container) {
            container.innerHTML = `
              <div style="color: #dc3545; text-align: center; padding: 20px;">
                <p><strong>Simulation Error:</strong></p>
                <p>${(scriptError as Error).message}</p>
              </div>
            `;
          }
        }
      }, 150); // Increased timeout for better reliability
    }

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cleanupSimulation();
      
      // Clean up global RAF tracking
      if (window.__simulationRAFIds) {
        window.__simulationRAFIds.forEach((id: number) => cancelAnimationFrame(id));
        delete window.__simulationRAFIds;
      }
    };
  }, [simulationData]);

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSuggestion('');
    setRawResponse('');
    
    // Clean up before starting new simulation
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
        throw new Error(`Unexpected response format (status: ${response.status}): ${textResponse.substring(0, 200)}...`);
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
        console.log('✓ Valid simulation data received');
        setSimulationData({
          canvasHtml: data.canvasHtml,
          jsCode: data.jsCode
        });
      } else {
        setError('Invalid simulation data received from backend');
        console.error('Backend response missing required fields:', data);
      }

    } catch (err: any) {
      console.error('Simulation request error:', err);
      setError(err.message || 'Failed to connect to the simulation engine.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupSimulation();
      if (window.__simulationRAFIds) {
        window.__simulationRAFIds.forEach((id: number) => cancelAnimationFrame(id));
        delete window.__simulationRAFIds;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 p-6 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6">Simulation Prompt</h2>

          {/* Subject Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
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

          {/* Prompt Input */}
          <div className="flex-grow mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to simulate..."
              className="w-full h-48 bg-gray-700 text-white rounded-lg p-3 resize-none"
            />
          </div>

          {/* Run Button */}
          <button
            onClick={runSimulation}
            disabled={loading || !prompt.trim()}
            className="bg-yellow-500 text-black py-3 px-4 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            Run Simulation
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Simulation Panel */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-gray-800 rounded-lg h-full flex flex-col">
              <div className="border-b border-gray-700 p-4">
                <h2 className="text-xl font-bold text-white">Simulation</h2>
              </div>

              {/* Messages and Simulation Output */}
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
  );
}
