import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { Play, Eye, EyeOff, LogOut, RefreshCw, Plus, Menu, X } from 'lucide-react';

interface SimulationResponse {
  canvasHtml: string;
  jsCode: string;
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
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [tokenUsage, setTokenUsage] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Debug logging
  console.log('Demo render state:', { user, authLoading, authError });

  useEffect(() => {
    // Generate follow-up questions based on the simulation
    if (simulationData && prompt) {
      const questions = generateFollowUpQuestions(prompt, subject);
      setFollowUpQuestions(questions);
    } else {
      setFollowUpQuestions([]);
    }
  }, [simulationData, prompt, subject]);

  // Generate context-aware follow-up questions
  const generateFollowUpQuestions = (currentPrompt: string, currentSubject: string): string[] => {
    const baseQuestions = [
      "Can you explain the result in simpler terms?",
      "What are the real-world applications of this simulation?",
      "How does this compare to a different method?",
      "What would happen if I change this variable?"
    ];

    const subjectSpecificQuestions: Record<string, string[]> = {
      Mathematics: [
        "Can you show this with different values?",
        "What's the mathematical proof behind this?",
        "How does this relate to other mathematical concepts?",
        "Can you visualize the inverse operation?"
      ],
      Physics: [
        "What forces are acting in this simulation?",
        "How would this change in a different environment?",
        "Can you show the energy transformations?",
        "What happens at different scales?"
      ],
      Chemistry: [
        "What are the molecular interactions here?",
        "How does temperature affect this reaction?",
        "Can you show the electron movement?",
        "What are the byproducts of this process?"
      ],
      Biology: [
        "How does this process vary in different organisms?",
        "What happens when this process goes wrong?",
        "Can you show the cellular mechanisms?",
        "How does this relate to evolution?"
      ]
    };

    // Combine base questions with subject-specific ones
    const allQuestions = [...baseQuestions, ...(subjectSpecificQuestions[currentSubject] || [])];
    
    // Return 3-4 random questions
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 3); // 3-4 questions
  };

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
      console.log('Sending request to Supabase Edge Function...');
      
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No valid session found. Please log in again.');
      }

      // Make request to Supabase Edge Function
      const response = await fetch(
        'https://zurfhydnztcxlomdyqds.supabase.co/functions/v1/simulate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            subject: subject
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Simulation failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data: SimulationResponse = await response.json();
      
      if (!data.canvasHtml || !data.jsCode) {
        throw new Error('Invalid response format from simulation service');
      }

      console.log('Simulation generated successfully');
      setSimulationData(data);
      
      // Inject the simulation into the iframe
      if (iframeRef.current) {
        const combinedContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MindRender Simulation</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
              }
              canvas {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              }
            </style>
          </head>
          <body>
            ${data.canvasHtml}
            <script>
              ${data.jsCode}
            </script>
          </body>
          </html>
        `;
        
        const blob = new Blob([combinedContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframeRef.current.src = url;
        
        // Clean up the blob URL after iframe loads
        iframeRef.current.onload = () => {
          URL.revokeObjectURL(url);
        };
      }
      
      setTokenUsage(prev => prev + 1);
    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err.message || 'An error occurred while generating the simulation');
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
    setFollowUpQuestions([]);
    
    // Clear the iframe
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
  };

  const handleFollowUpQuestion = (question: string): void => {
    // Set the follow-up question as the new prompt and run simulation
    setPrompt(question);
    // Auto-run the simulation with the follow-up question
    setTimeout(() => {
      handleRunSimulation();
    }, 100);
  };

  const toggleSidebar = (): void => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Custom Demo Navbar */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-white">MindRender</h1>
            <button
              onClick={toggleSidebar}
              className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={handleNewSimulation}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors flex items-center space-x-2 ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>New Simulation</span>
            </button>
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

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Menu</h2>
            <button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Token Usage Section */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Token Usage</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Used:</span>
                  <span className="text-white">{tokenUsage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Remaining:</span>
                  <span className="text-white">{2000 - tokenUsage}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-3">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(tokenUsage / 2000) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 text-center">
                  {((tokenUsage / 2000) * 100).toFixed(1)}% of 2,000 tokens
                </div>
              </div>
            </div>

            {/* Previous Chats Section */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-3">Previous Chats</h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((chatId) => (
                  <button
                    key={chatId}
                    className="w-full text-left bg-gray-700/30 hover:bg-gray-700/50 rounded-lg p-3 transition-colors"
                  >
                    <div className="text-sm text-white">Chat {chatId}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {chatId === 1 && "Visualize binary search algorithm..."}
                      {chatId === 2 && "Show how mitosis works..."}
                      {chatId === 3 && "Simulate predator-prey dynamics..."}
                      {chatId === 4 && "Demonstrate wave interference..."}
                      {chatId === 5 && "Explain photosynthesis process..."}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Settings Button */}
          <div className="p-4 border-t border-gray-700">
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <div className="w-full md:w-80 lg:w-96 bg-gray-800 border-r border-gray-700 flex flex-col rounded-tl-xl">
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

            {/* Follow Up Questions Section - Only show after simulation */}
            {simulationData && followUpQuestions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Follow Up Questions
                </label>
                <div className="space-y-2">
                  {followUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleFollowUpQuestion(question)}
                      disabled={loading}
                      className="w-full text-left bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg px-3 py-3 text-sm text-blue-200 hover:text-blue-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {question}
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
                  onClick={() => handleFollowUpQuestion("Can you explain this in more detail?")}
                  disabled={loading}
                  className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Explain More
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
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 text-xs mt-2 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Simulation Area */}
        <div className="flex-1 bg-white relative overflow-hidden rounded-tr-xl">
          {simulationData ? (
            <div className="h-full">
              <iframe
                ref={iframeRef}
                id="simulation-iframe"
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
              <div className="ml-2 text-gray-400">Follow-ups: {followUpQuestions.length}</div>
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