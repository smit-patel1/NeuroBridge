import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, ChevronDown, Code } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

export default function Demo() {
  const navigate = useNavigate();
  const { user, session, loading: authLoading, error: authError, withValidSession, signOut } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [simulationData, setSimulationData] = useState<{ canvasHtml: string, jsCode: string } | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [rawResponse, setRawResponse] = useState('');
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [tokenLoading, setTokenLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('Demo: User not authenticated, redirecting to auth');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch token usage on mount and after auth changes
  useEffect(() => {
    if (user?.id) {
      fetchTokenUsage();
    }
  }, [user?.id]);

  const fetchTokenUsage = async () => {
    if (!user?.id) return;
    
    try {
      setTokenLoading(true);
      console.log('Demo: Fetching token usage for user:', user.id);
      
      const { data, error } = await supabase
        .from('token_usage')
        .select('sum(tokens_used)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Demo: Token usage fetch error:', error);
        return;
      }

      const tokens = data?.sum || 0;
      setTotalTokensUsed(tokens);
      console.log('Demo: Current token usage:', tokens);
    } catch (error) {
      console.error('Demo: Token usage fetch failed:', error);
    } finally {
      setTokenLoading(false);
    }
  };

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

  useEffect(() => {
    if (simulationData && iframeRef.current) {
      try {
        const iframe = iframeRef.current;
        const doc = createSimulationDocument(simulationData.canvasHtml, simulationData.jsCode);
        iframe.srcdoc = doc;

        iframe.onload = () => {
          console.log('Demo: Simulation loaded successfully');
        };

        iframe.onerror = (error) => {
          console.error('Demo: Iframe loading error:', error);
          setError('Failed to load simulation');
        };

      } catch (error) {
        console.error('Demo: Simulation creation error:', error);
        setError(`Simulation creation failed: ${(error as Error).message}`);
      }
    }
  }, [simulationData]);

  const runSimulation = async () => {
    // Check token limit before proceeding
    if (totalTokensUsed >= 2000) {
      setError('Token limit exceeded (2000 tokens). You have reached your usage limit for this demo.');
      console.log('Demo: Token limit exceeded, blocking simulation');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a simulation prompt');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestion('');
    setRawResponse('');
    setSimulationData(null);

    try {
      console.log('Demo: Starting simulation run...');
      console.log('Demo: Current user:', user?.email);
      console.log('Demo: Prompt:', prompt);
      console.log('Demo: Subject:', subject);

      await withValidSession(async () => {
        // Verify user authentication with fresh check
        if (!user?.id) {
          console.error('Demo: No user ID available');
          navigate('/auth');
          return;
        }

        console.log('Demo: Making API request to simulation endpoint...');
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
        console.log('Demo: Received response from API');

        if (data.suggestion) {
          setSuggestion(data.suggestion);
          console.log('Demo: Received suggestion instead of simulation');
          return;
        }

        if (data.error) {
          setError(data.error);
          console.error('Demo: API returned error:', data.error);
          return;
        }

        if (!data.canvasHtml || !data.jsCode) {
          throw new Error('Incomplete simulation data received from server');
        }

        setSimulationData({
          canvasHtml: data.canvasHtml,
          jsCode: data.jsCode
        });
        console.log('Demo: Simulation data set successfully');

        // Refresh token usage after successful simulation
        await fetchTokenUsage();
      });

    } catch (err: any) {
      console.error('Demo: Simulation request error:', err);
      
      // Handle specific auth errors
      if (err.message?.includes('Session invalid') || err.message?.includes('Auth session missing')) {
        console.log('Demo: Auth session invalid, redirecting to auth');
        navigate('/auth');
        return;
      }
      
      setError(err.message || 'Failed to generate simulation');
      
      // Refresh token usage even after errors to get current state
      await fetchTokenUsage();
    } finally {
      // Always clear loading state to ensure button becomes responsive again
      setLoading(false);
      console.log('Demo: Simulation request finished (loading state cleared)');
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Demo: User signing out...');
      await signOut();
      console.log('Demo: Sign out successful');
    } catch (error: any) {
      console.error('Demo: Sign out failed:', error);
      setError('Failed to sign out: ' + error.message);
    }
  };

  const resetSimulation = () => {
    console.log('Demo: Resetting simulation state...');
    setSimulationData(null);
    setError('');
    setSuggestion('');
    setRawResponse('');
    if (iframeRef.current) {
      iframeRef.current.srcdoc = '';
    }
    console.log('Demo: Simulation state reset complete');
  };

  const runFollowUp = async () => {
    if (!simulationData) {
      setError('No simulation to follow up on');
      return;
    }

    // Check token limit
    if (totalTokensUsed >= 2000) {
      setError('Token limit exceeded (2000 tokens). You have reached your usage limit for this demo.');
      return;
    }

    const followUpPrompt = `Based on the current simulation: ${prompt}, suggest an improvement or variation`;
    
    setLoading(true);
    setError('');

    try {
      console.log('Demo: Running follow-up simulation...');
      
      await withValidSession(async () => {
        if (!user?.id) {
          console.error('Demo: No user ID for follow-up');
          navigate('/auth');
          return;
        }

        const response = await fetch("https://zurfhydnztcxlomdyqds.functions.supabase.co/simulate", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ prompt: followUpPrompt, subject }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.suggestion) {
          setSuggestion(data.suggestion);
          return;
        }

        if (data.error) {
          setError(data.error);
          return;
        }

        if (data.canvasHtml && data.jsCode) {
          setSimulationData({
            canvasHtml: data.canvasHtml,
            jsCode: data.jsCode
          });
          setPrompt(followUpPrompt);
        }

        // Refresh token usage
        await fetchTokenUsage();
      });

    } catch (err: any) {
      console.error('Demo: Follow-up request error:', err);
      
      if (err.message?.includes('Session invalid') || err.message?.includes('Auth session missing')) {
        navigate('/auth');
        return;
      }
      
      setError(err.message || 'Failed to generate follow-up simulation');
      await fetchTokenUsage();
    } finally {
      setLoading(false);
      console.log('Demo: Follow-up request finished');
    }
  };

  // Show loading state while auth is initializing
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

  // Show auth error if present
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200 max-w-md">
          <AlertCircle className="w-5 h-5 mr-2 inline" />
          Authentication Error: {authError}
          <button 
            onClick={() => navigate('/auth')}
            className="block mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-400"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl mb-4">Please log in to continue</h1>
          <button 
            onClick={() => navigate('/auth')}
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const isTokenLimitReached = totalTokensUsed >= 2000;

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      <div className="container-responsive mx-auto py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div>
            <h1 className="responsive-text-2xl font-bold text-white mb-2">MindRender Demo</h1>
            <p className="text-gray-400">Transform your ideas into interactive simulations</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Token Usage Display */}
            <div className="bg-gray-800 px-4 py-2 rounded-lg">
              <div className="text-sm text-gray-300">
                Token Usage: {tokenLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin inline ml-1" />
                ) : (
                  <span className={isTokenLimitReached ? 'text-red-400 font-bold' : 'text-white'}>
                    {totalTokensUsed} / 2000
                  </span>
                )}
              </div>
              {isTokenLimitReached && (
                <div className="text-xs text-red-400 mt-1">Limit reached</div>
              )}
            </div>
            
            {/* User Info & Sign Out */}
            <div className="flex items-center space-x-3">
              <span className="text-gray-300 text-sm">{user.email}</span>
              <button 
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="desktop-layout tablet-layout gap-8">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            {/* Subject Selection */}
            <div className="bg-gray-800 p-6 rounded-xl">
              <label className="block text-white font-medium mb-3">Subject</label>
              <div className="relative">
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {subjects.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Prompt Input */}
            <div className="bg-gray-800 p-6 rounded-xl">
              <label className="block text-white font-medium mb-3">Simulation Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to visualize..."
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={runSimulation}
                disabled={loading || !prompt.trim() || isTokenLimitReached}
                className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Run Simulation'
                )}
              </button>

              {simulationData && (
                <div className="flex gap-3">
                  <button
                    onClick={runFollowUp}
                    disabled={loading || isTokenLimitReached}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Follow Up
                  </button>
                  <button
                    onClick={resetSimulation}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-500 transition-colors"
                  >
                    New Simulation
                  </button>
                </div>
              )}
            </div>

            {/* Debug Console Toggle */}
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="w-full bg-gray-700 text-gray-300 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <Code className="w-4 h-4 mr-2" />
              {showConsole ? 'Hide' : 'Show'} Debug Console
            </button>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-1">
            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-200 mb-6">
                <AlertCircle className="w-5 h-5 mr-2 inline" />
                {error}
              </div>
            )}

            {/* Suggestion Display */}
            {suggestion && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-200 mb-6">
                <h3 className="font-semibold mb-2">Suggestion:</h3>
                <p>{suggestion}</p>
              </div>
            )}

            {/* Simulation Display */}
            {simulationData ? (
              <div className="bg-gray-800 rounded-xl overflow-hidden">
                <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
                  <h3 className="text-white font-medium">Simulation Output</h3>
                </div>
                <div className="p-4">
                  <iframe
                    ref={iframeRef}
                    className="w-full h-96 bg-white rounded-lg"
                    title="Simulation"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Your simulation will appear here</p>
                </div>
              </div>
            )}

            {/* Debug Console */}
            {showConsole && rawResponse && (
              <div className="bg-gray-800 rounded-xl mt-6 overflow-hidden">
                <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
                  <h3 className="text-white font-medium">Debug Console</h3>
                </div>
                <div className="p-4">
                  <pre className="text-gray-300 text-sm overflow-auto max-h-64">
                    {rawResponse}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}