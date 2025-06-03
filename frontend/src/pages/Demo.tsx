import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, Code } from 'lucide-react';

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

export default function Demo() {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [simulationData, setSimulationData] = useState<{ canvasHtml: string; jsCode: string } | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [rawResponse, setRawResponse] = useState('');
  const simulationRef = useRef<HTMLDivElement>(null);

  // Clean up function to remove old simulation scripts
  const cleanupSimulation = () => {
    // Remove any existing simulation scripts from document
    document.querySelectorAll('script[data-simulation]').forEach(script => {
      script.remove();
    });
    
    // Clear simulation container
    if (simulationRef.current) {
      simulationRef.current.innerHTML = '';
    }
  };

  // When simulationData changes, inject new canvas and script
  useEffect(() => {
    if (!simulationData || !simulationRef.current) return;

    try {
      const container = simulationRef.current;
      
      // Clean up old simulation
      cleanupSimulation();

      // Insert the canvas HTML
      const wrapper = document.createElement('div');
      wrapper.innerHTML = simulationData.canvasHtml.trim();
      const canvasElement = wrapper.firstElementChild;
      
      if (canvasElement instanceof HTMLElement) {
        container.appendChild(canvasElement);
        
        // Wait for canvas to be in DOM, then execute script
        setTimeout(() => {
          try {
            // Create script element and append to document head (not container)
            const script = document.createElement('script');
            script.setAttribute('data-simulation', 'true');
            script.textContent = simulationData.jsCode;
            
            // Add error handling to the script
            script.onerror = (error) => {
              console.error('Script execution error:', error);
              setError('Animation script failed to execute');
            };
            
            document.head.appendChild(script);
          } catch (scriptError) {
            console.error('Script creation error:', scriptError);
            setError('Failed to create animation script');
          }
        }, 100);
      } else {
        setError('Invalid canvas HTML received');
      }
    } catch (domError) {
      console.error('DOM manipulation error:', domError);
      setError('Failed to create simulation canvas');
    }
  }, [simulationData]);

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSuggestion('');
    setRawResponse('');
    
    // Clean up any existing simulation first
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

      // Validate response structure
      if (data.canvasHtml && data.jsCode) {
        console.log('✓ Valid simulation data received');
        setSimulationData({
          canvasHtml: data.canvasHtml,
          jsCode: data.jsCode,
        });
      } else {
        const missingFields = [];
        if (!data.canvasHtml) missingFields.push('canvasHtml');
        if (!data.jsCode) missingFields.push('jsCode');
        
        setError(`Backend returned incomplete data. Missing: ${missingFields.join(', ')}`);
        console.error('Invalid backend response:', data);
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
                  <option key={s} value={s}>
                    {s}
                  </option>
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
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
                    <div className="text-sm whitespace-pre-wrap">{error}</div>
                  </div>
                )}

                {/* Simulation Container */}
                <div
                  ref={simulationRef}
                  className="bg-white rounded-lg p-4 min-h-[400px] flex items-center justify-center"
                >
                  {!simulationData && !loading && !error && (
                    <p className="text-gray-500">
                      Enter a prompt and click "Run Simulation" to get started
                    </p>
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
