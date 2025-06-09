import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { Play, Eye, EyeOff, LogOut, RefreshCw, Plus } from 'lucide-react';

interface SimulationData {
  url: string;
  id: string;
  title?: string;
}

interface User {
  email: string;
  id: string;
}

export default function Demo(): JSX.Element {
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const [subject, setSubject] = useState<string>('Mathematics');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [tokenUsage, setTokenUsage] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Debug logging
  console.log('Demo render state:', { user, authLoading, authError });

  useEffect(() => {
    // Set some example suggestions based on subject
    const subjectSuggestions: Record<string, string[]> = {
      Mathematics: [
        "Visualize the Pythagorean theorem",
        "Show how derivatives work",
        "Demonstrate matrix multiplication"
      ],
      Physics: [
        "Simulate projectile motion",
        "Show electromagnetic waves",
        "Demonstrate pendulum motion"
      ],
      Chemistry: [
        "Visualize molecular bonding",
        "Show chemical reactions",
        "Demonstrate pH changes"
      ],
      Biology: [
        "Show cell division",
        "Demonstrate DNA replication",
        "Visualize photosynthesis"
      ]
    };
    setSuggestions(subjectSuggestions[subject] || []);
  }, [subject]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          <div className="text-white text-lg">Loading authentication...</div>
        </div>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md mx-4">
          <div className="text-red-400 text-center">
            <div className="text-xl font-semibold mb-2">Authentication Error</div>
            <div className="text-sm">{authError}</div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 rounded-xl p-8 max-w-md mx-4">
          <div className="text-white text-xl font-semibold mb-4">Access Required</div>
          <div className="text-gray-300 mb-6">Please log in to access the MindRender demo</div>
          <a 
            href="/auth" 
            className="inline-flex items-center bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const handleRunSimulation = async (): Promise<void> => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      const result = await runSimulation(prompt, subject);
      setSimulationData(result);
      setTokenUsage(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleNewSimulation = (): void => {
    setSimulationData(null);
    setPrompt('');
    setError(null);
  };

  const handleFollowUp = (): void => {
    // Logic for follow-up questions
    console.log('Follow up simulation');
  };

  const handleSuggestionClick = (suggestion: string): void => {
    setPrompt(suggestion);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">MindRender Demo</h1>
            <div className="hidden sm:block w-px h-6 bg-gray-600"></div>
            <div className="hidden sm:block text-sm text-gray-400">
              Interactive Learning Simulations
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-gray-700/50 rounded-lg px-3 py-1">
                <span className="text-sm text-gray-300">
                  Tokens: <span className="text-yellow-400 font-medium">{tokenUsage}</span> / 2000
                </span>
              </div>
              <div className="text-sm text-gray-300 hidden lg:block">{user.email}</div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className="w-full md:w-80 lg:w-96 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Subject Area
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Simulation Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to simulate... (e.g., 'Show how gravity affects projectile motion')"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white h-32 resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors placeholder-gray-400"
              />
              <div className="text-xs text-gray-400 mt-2">
                {prompt.length}/500 characters
              </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !prompt && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Try these examples:
                </label>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={handleRunSimulation}
              disabled={loading || !prompt.trim()}
              className="w-full bg-yellow-500 text-black py-4 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>Running Simulation...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>

            {/* Action Buttons */}
            {simulationData && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleFollowUp}
                  className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors text-sm"
                >
                  Follow Up
                </button>
                <button
                  onClick={handleNewSimulation}
                  className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors text-sm flex items-center justify-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>New</span>
                </button>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-red-400 mt-0.5">⚠️</div>
                  <div>
                    <div className="text-red-400 font-medium text-sm">Simulation Error</div>
                    <div className="text-red-300 text-sm mt-1">{error}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Simulation Area */}
        <div className="flex-1 bg-white relative overflow-hidden">
          {simulationData ? (
            <div className="h-full">
              <iframe
                src={simulationData.url}
                className="w-full h-full border-0"
                title="Interactive Simulation"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Play className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  Ready to Simulate
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Enter a prompt describing what you'd like to learn about, then click "Run Simulation" to see it come to life.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Console Toggle */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors flex items-center space-x-2 shadow-lg border border-gray-600"
        >
          {showConsole ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="hidden sm:inline">{showConsole ? 'Hide' : 'Show'} Console</span>
        </button>
      </div>

      {/* Debug Console */}
      {showConsole && (
        <div className="fixed bottom-20 right-6 w-80 h-64 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-40 overflow-hidden">
          <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
            <h3 className="text-white font-semibold text-sm">Debug Console</h3>
          </div>
          <div className="p-4 h-full overflow-auto text-xs space-y-2">
            <div className="text-gray-300">
              <div className="text-yellow-400 font-mono">User Info:</div>
              <div className="ml-2 text-gray-400">Email: {user?.email}</div>
              <div className="ml-2 text-gray-400">ID: {user?.id}</div>
            </div>
            <div className="text-gray-300">
              <div className="text-yellow-400 font-mono">Session:</div>
              <div className="ml-2 text-gray-400">Subject: {subject}</div>
              <div className="ml-2 text-gray-400">Loading: {loading.toString()}</div>
              <div className="ml-2 text-gray-400">Token Usage: {tokenUsage}</div>
              <div className="ml-2 text-gray-400">Has Simulation: {!!simulationData}</div>
            </div>
            {error && (
              <div className="text-gray-300">
                <div className="text-red-400 font-mono">Error:</div>
                <div className="ml-2 text-red-300 break-words">{error}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder simulation function with proper typing
async function runSimulation(prompt: string, subject: string): Promise<SimulationData> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          url: `data:text/html;charset=utf-8,${encodeURIComponent(`
            <html>
              <head>
                <title>Simulation: ${subject}</title>
                <style>
                  body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    margin: 0;
                    padding: 40px;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                  }
                  .container {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 20px;
                    padding: 40px;
                    text-align: center;
                    max-width: 600px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                  }
                  h1 { color: #ffd700; margin-bottom: 20px; }
                  .simulation-box {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 15px;
                    padding: 30px;
                    margin: 20px 0;
                    border: 2px dashed rgba(255, 255, 255, 0.3);
                  }
                  .pulse {
                    animation: pulse 2s infinite;
                  }
                  @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>🧠 MindRender Simulation</h1>
                  <h2>Subject: ${subject}</h2>
                  <div class="simulation-box pulse">
                    <h3>📊 Interactive Visualization</h3>
                    <p><strong>Prompt:</strong> "${prompt}"</p>
                    <p>✨ This simulation would visualize your concept interactively!</p>
                    <p>🎯 Features: 3D graphics, interactive controls, real-time feedback</p>
                  </div>
                  <p><em>Demo simulation - Full version would include interactive 3D visualizations, animations, and user controls.</em></p>
                </div>
              </body>
            </html>
          `)}`
        });
      } else {
        reject(new Error('Simulation generation failed. Please try again.'));
      }
    }, 2000 + Math.random() * 2000); // 2-4 second delay
  });
}
