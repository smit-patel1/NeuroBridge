import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, Code, MessageSquare, Lightbulb, RefreshCw, MoreHorizontal } from 'lucide-react';

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

const commonQuestions = [
  'Can you explain this in simpler terms?',
  'Show me a different example',
  'Make it more complex',
  'Slow down the animation'
];

export default function Demo() {
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [simulationData, setSimulationData] = useState<{canvasHtml: string, jsCode: string} | null>(null);
  const [rawResponse, setRawResponse] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showFollowUpOptions, setShowFollowUpOptions] = useState(false);
  const followUpRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (followUpRef.current && !followUpRef.current.contains(event.target as Node)) {
        setShowFollowUpOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            padding: 0; 
            font-family: Arial, sans-serif;
            background: #f8f9fa;
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          canvas { 
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
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

  useEffect(() => {
    if (simulationData && iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const doc = createSimulationDocument(simulationData.canvasHtml, simulationData.jsCode);
        iframe.srcdoc = doc;
        
        iframe.onload = () => {
          console.log('✓ Simulation loaded successfully in iframe');
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
      const response = await fetch("https://zurfhydnztcxlomdyqds.functions.supabase.co/simulate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      console.log('✓ Valid simulation data received');
      setSimulationData({
        canvasHtml: data.canvasHtml,
        jsCode: data.jsCode
      });

    } catch (err) {
      console.error('Simulation request error:', err);
      setError((err as Error).message || 'Failed to generate simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpPrompt.trim()) return;
    console.log('Follow-up:', followUpPrompt);
    setFollowUpPrompt('');
  };

  const selectFollowUpOption = (question: string) => {
    setFollowUpPrompt(question);
    setShowFollowUpOptions(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Fixed 300px width */}
        <div className="w-[300px] bg-gray-800 rounded-lg m-6 mr-3 p-6 flex flex-col overflow-hidden">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg py-2 px-3 appearance-none cursor-pointer hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-blue-500"
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
              className="w-full h-48 bg-gray-700 text-white rounded-lg p-3 resize-none hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={runSimulation}
            disabled={loading || !prompt.trim()}
            className="bg-yellow-500 text-black py-3 px-4 rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mb-6 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Run Simulation
          </button>

          {/* Follow Up Section */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <RefreshCw className="w-5 h-5 mr-2" />
                Follow Up
              </h3>
              <div className="relative" ref={followUpRef}>
                <button
                  onClick={() => setShowFollowUpOptions(!showFollowUpOptions)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
                {showFollowUpOptions && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-700 rounded-lg shadow-lg py-2 z-50">
                    {commonQuestions.map((question) => (
                      <button
                        key={question}
                        onClick={() => selectFollowUpOption(question)}
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-600 transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={followUpPrompt}
                onChange={(e) => setFollowUpPrompt(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={handleFollowUp}
                disabled={!followUpPrompt.trim()}
                className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-300 w-16 flex-shrink-0"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 pl-3">
          <div className="grid grid-cols-[1fr,300px] gap-6 h-full">
            {/* Simulation Panel */}
            <div className="bg-gray-800 rounded-lg flex flex-col overflow-hidden">
              <div className="border-b border-gray-700 p-4">
                <h2 className="text-xl font-bold text-white">Simulation</h2>
              </div>

              <div className="flex-1 flex flex-col">
                {suggestion && (
                  <div className="p-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-200 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Prompt unclear</p>
                        <p>Try this: {suggestion}</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">{error}</div>
                    </div>
                  </div>
                )}

                <div className="flex-1 bg-gray-900 flex items-center justify-center overflow-hidden">
                  {!simulationData && !loading && !error && (
                    <div className="text-gray-400 text-center p-8">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Enter a prompt and click "Run Simulation\" to get started</p>
                    </div>
                  )}
                  
                  {loading && (
                    <div className="flex items-center justify-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mr-3" />
                      <span className="text-lg">Generating simulation...</span>
                    </div>
                  )}
                  
                  {simulationData && (
                    <iframe
                      ref={iframeRef}
                      className="w-full h-full border-0"
                      title="Simulation"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Explanation Panel */}
            <div className="bg-gray-800 rounded-lg flex flex-col">
              <div className="border-b border-gray-700 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Explanation
                </h2>
                <button
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors focus:ring-2 focus:ring-blue-500 text-sm ml-3"
                >
                  {showTechnicalDetails ? 'Show Simple' : 'Show Technical'}
                </button>
              </div>

              <div className="flex-1 p-4">
                {!simulationData ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                    <div className="bg-gray-700/30 rounded-full p-6 mb-4">
                      <Code className="w-12 h-12 opacity-70" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-300">Ready to Explain</h3>
                    <p className="text-gray-400">Run a simulation to see detailed explanations and insights</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">Key Points</h3>
                      <ul className="list-disc list-inside space-y-2 text-gray-300">
                        <li>Point 1 about the simulation</li>
                        <li>Point 2 about the simulation</li>
                        <li>Point 3 about the simulation</li>
                      </ul>
                    </div>

                    {showTechnicalDetails && (
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-white mb-3">Technical Details</h3>
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                          {/* Technical details would go here */}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}