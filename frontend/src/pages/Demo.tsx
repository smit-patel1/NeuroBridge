import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, ChevronDown, Code, MessageSquare, Lightbulb, RefreshCw, MoreHorizontal, Zap, Menu, X, Settings, Clock, LogOut, User, Plus, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const subjects = ['Mathematics', 'Physics', 'Computer Science'];

const commonQuestions = [
  'Can you explain this in simpler terms?',
  'Show me a different example',
  'Make it more complex',
  'Slow down the animation'
];

const TOKEN_LIMIT = 2000; // Free tier limit

// Mock previous chats data
const mockPreviousChats = [
  { id: 1, prompt: "Visualize binary search algorithm", timestamp: "2 hours ago" },
  { id: 2, prompt: "Show how mitosis works", timestamp: "1 day ago" },
  { id: 3, prompt: "Simulate predator-prey dynamics", timestamp: "3 days ago" },
  { id: 4, prompt: "Explain quantum tunneling effect", timestamp: "1 week ago" },
  { id: 5, prompt: "Demonstrate sorting algorithms comparison", timestamp: "2 weeks ago" },
];

export default function Demo() {
  const navigate = useNavigate();
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
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const followUpRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('❌ Demo: Auth error:', error);
          navigate('/auth');
          return;
        }
        
        if (!user) {
          console.log('❌ Demo: No user found, redirecting to auth');
          navigate('/auth');
          return;
        }
        
        console.log('✓ Demo: User authenticated:', user.email);
        setUser(user);
        setAuthLoading(false);
      } catch (error) {
        console.error('❌ Demo: Auth check error:', error);
        navigate('/auth');
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('✓ Demo: Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('✓ Demo: User signed out, redirecting to auth');
        navigate('/auth');
      } else if (session) {
        // Use getUser() to get the most current user data
        const { data: { user }, error } = await supabase.auth.getUser();
        if (user && !error) {
          console.log('✓ Demo: User session updated:', user.email);
          setUser(user);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load token usage when user is available
  useEffect(() => {
    if (user) {
      loadTokenUsage();
    }
  }, [user]);

  const loadTokenUsage = async () => {
    if (!user?.id) {
      console.error('❌ Demo: No user ID available for token usage loading');
      return;
    }
    
    setTokensLoading(true);
    try {
      const { data, error } = await supabase
        .from('token_usage')
        .select('sum(tokens_used)')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Demo: Error loading token usage:', error);
        return;
      }

      const totalTokensUsed = data?.sum || 0;
      setTokensUsed(totalTokensUsed);
      console.log(`✓ Demo: Loaded token usage: ${totalTokensUsed} tokens for user ${user.id}`);
    } catch (error) {
      console.error('❌ Demo: Error calculating token usage:', error);
    } finally {
      setTokensLoading(false);
    }
  };

  const estimateTokenUsage = (prompt: string, completion: string): number => {
    // Rough estimation: ~4 characters per token
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(completion.length / 4);
    return promptTokens + completionTokens;
  };

  const logTokenUsage = async (tokens: number, promptText: string) => {
    try {
      // Get the most current user data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Demo: Error getting user for token logging:', userError);
        return;
      }
      
      if (!user?.id) {
        console.error('❌ Demo: No user ID available for token logging');
        return;
      }

      const { error } = await supabase
        .from('token_usage')
        .insert([
          {
            user_id: user.id,
            tokens_used: tokens,
            prompt: promptText,
          }
        ]);

      if (error) {
        console.error('❌ Demo: Token usage insert failed:', error.message);
        return;
      }

      // Update local token count only after successful insert
      setTokensUsed(prev => prev + tokens);
      console.log(`✓ Demo: Successfully logged ${tokens} tokens for user ${user.id}`);
      
      // Refresh token usage from database to ensure accuracy
      await loadTokenUsage();
      
    } catch (error) {
      console.error('❌ Demo: Error inserting token usage:', error);
    }
  };

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
          console.log('✓ Demo: Simulation loaded successfully in iframe');
        };
        
        iframe.onerror = (error) => {
          console.error('❌ Demo: Iframe loading error:', error);
          setError('Failed to load simulation');
        };
        
      } catch (error) {
        console.error('❌ Demo: Simulation creation error:', error);
        setError(`Simulation creation failed: ${(error as Error).message}`);
      }
    }
  }, [simulationData]);

  const runSimulation = async () => {
    console.log('🔄 Demo: Starting simulation run...');
    
    // Verify user authentication before proceeding
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      console.error('❌ Demo: Authentication required for simulation');
      setError('Authentication required. Please log in to use the simulation.');
      navigate('/auth');
      return;
    }

    console.log('✓ Demo: User authenticated, checking token usage...');

    // Refresh token usage before checking limit
    await loadTokenUsage();

    // Check token limit before making request
    if (tokensUsed >= TOKEN_LIMIT) {
      console.log('❌ Demo: Token limit reached');
      setError(`You've reached your free token limit (${TOKEN_LIMIT.toLocaleString()} tokens). Please contact support for more access.`);
      return;
    }

    console.log(`✓ Demo: Token check passed (${tokensUsed}/${TOKEN_LIMIT}), running simulation...`);

    // Reset all simulation state before starting
    setLoading(true);
    setError('');
    setSuggestion('');
    setRawResponse('');
    // Note: We don't clear simulationData here to allow running same prompt multiple times

    try {
      console.log('🔄 Demo: Sending request to simulation API...');
      
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
        console.log('✓ Demo: Received suggestion from API');
        setSuggestion(data.suggestion);
        // Refresh token usage even for suggestions
        await loadTokenUsage();
        return;
      }

      if (data.error) {
        console.error('❌ Demo: API returned error:', data.error);
        setError(data.error);
        // Refresh token usage even for errors
        await loadTokenUsage();
        return;
      }

      if (!data.canvasHtml || !data.jsCode) {
        throw new Error('Incomplete simulation data received from server');
      }

      console.log('✓ Demo: Valid simulation data received, updating UI...');
      setSimulationData({
        canvasHtml: data.canvasHtml,
        jsCode: data.jsCode
      });

      // Extract token usage from Perplexity API response
      const tokensUsedInRequest = data.usage?.total_tokens || 0;
      
      // If no usage data from API, estimate token usage
      let finalTokensUsed = tokensUsedInRequest;
      if (finalTokensUsed === 0) {
        const completion = data.canvasHtml + data.jsCode;
        finalTokensUsed = estimateTokenUsage(prompt, completion);
        console.log(`⚠️ Demo: No usage data from API, estimated ${finalTokensUsed} tokens`);
      } else {
        console.log(`✓ Demo: API reported ${finalTokensUsed} tokens used`);
      }

      // Log the token usage to Supabase
      if (finalTokensUsed > 0) {
        await logTokenUsage(finalTokensUsed, prompt);
      }

      console.log('✓ Demo: Simulation completed successfully');

    } catch (err) {
      console.error('❌ Demo: Simulation request error:', err);
      setError((err as Error).message || 'Failed to generate simulation');
      // Refresh token usage even after errors
      await loadTokenUsage();
    } finally {
      setLoading(false);
      console.log('✓ Demo: Simulation request finished (loading state cleared)');
    }
  };

  const handleFollowUp = async () => {
    if (!followUpPrompt.trim()) return;
    
    console.log('🔄 Demo: Starting follow-up request...');
    
    // Verify user authentication before proceeding
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      console.error('❌ Demo: Authentication required for follow-up');
      setError('Authentication required. Please log in to continue.');
      navigate('/auth');
      return;
    }
    
    // Refresh token usage before checking limit
    await loadTokenUsage();
    
    // Check token limit for follow-up requests
    if (tokensUsed >= TOKEN_LIMIT) {
      console.log('❌ Demo: Token limit reached for follow-up');
      setError(`You've reached your free token limit (${TOKEN_LIMIT.toLocaleString()} tokens). Please contact support for more access.`);
      return;
    }

    console.log('✓ Demo: Follow-up token check passed, processing request...');

    setLoading(true);
    setError('');

    try {
      // Make follow-up request to the simulation API
      const response = await fetch("https://zurfhydnztcxlomdyqds.functions.supabase.co/simulate", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: followUpPrompt, 
          subject,
          followUp: true,
          previousSimulation: simulationData 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error('❌ Demo: Follow-up API error:', data.error);
        setError(data.error);
        // Refresh token usage even for errors
        await loadTokenUsage();
        return;
      }

      // Update simulation if new data is provided
      if (data.canvasHtml && data.jsCode) {
        console.log('✓ Demo: Follow-up returned new simulation data');
        setSimulationData({
          canvasHtml: data.canvasHtml,
          jsCode: data.jsCode
        });
      }

      // Log token usage for follow-up request
      const tokensUsedInRequest = data.usage?.total_tokens || 0;
      let finalTokensUsed = tokensUsedInRequest;
      
      if (finalTokensUsed === 0) {
        // Estimate tokens for follow-up (typically smaller)
        finalTokensUsed = estimateTokenUsage(followUpPrompt, data.response || '');
      }

      if (finalTokensUsed > 0) {
        await logTokenUsage(finalTokensUsed, `Follow-up: ${followUpPrompt}`);
      }

      setFollowUpPrompt('');
      console.log('✓ Demo: Follow-up request completed successfully');

    } catch (err) {
      console.error('❌ Demo: Follow-up request error:', err);
      setError((err as Error).message || 'Failed to process follow-up request');
      // Refresh token usage even after errors
      await loadTokenUsage();
    } finally {
      setLoading(false);
      console.log('✓ Demo: Follow-up request finished (loading state cleared)');
    }
  };

  const selectFollowUpOption = (question: string) => {
    setFollowUpPrompt(question);
    setShowFollowUpOptions(false);
  };

  const handleChatClick = (chat: any) => {
    setPrompt(chat.prompt);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    console.log('🔄 Demo: Starting new chat - clearing all state...');
    
    // Clear all simulation state
    setPrompt('');
    setSimulationData(null);
    setError('');
    setSuggestion('');
    setRawResponse('');
    setFollowUpPrompt('');
    setShowTechnicalDetails(false);
    setShowFollowUpOptions(false);
    setLoading(false); // Ensure loading is cleared
    
    // Reset subject to default
    setSubject(subjects[0]);
    
    console.log('✓ Demo: New chat started - interface reset');
  };

  const handleSignOut = async () => {
    console.log('🔄 Demo: User signing out...');
    await supabase.auth.signOut();
    navigate('/');
  };

  const remainingTokens = TOKEN_LIMIT - tokensUsed;
  const usagePercentage = (tokensUsed / TOKEN_LIMIT) * 100;
  const isTokenLimitReached = tokensUsed >= TOKEN_LIMIT;

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center justify-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3" />
          <span className="text-lg">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Custom Demo Navbar */}
      <nav className="fixed w-full bg-gray-900/95 backdrop-blur-sm z-50 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo and Hamburger Menu */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">MindRender</h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg shadow-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Right Side - New Chat Button and User Info */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleNewChat}
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2 shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>New Simulation</span>
              </button>

              {user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <User className="w-4 h-4" />
                    <span className="text-sm hidden sm:inline">{user.email}</span>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:w-72`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 mt-20">
            <h2 className="text-xl font-bold text-white">Sidebar</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Token Usage Section - Moved to top */}
          <div className="p-4 border-b border-gray-700">
            <div className={`rounded-lg p-4 ${isTokenLimitReached ? 'bg-red-900/50 border border-red-500/50' : 'bg-gray-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Token Usage
                </h3>
                {tokensLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Used:</span>
                  <span className={`font-medium ${isTokenLimitReached ? 'text-red-400' : 'text-white'}`}>
                    {tokensUsed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Remaining:</span>
                  <span className={`font-medium ${remainingTokens < 100 ? 'text-red-400' : 'text-green-400'}`}>
                    {remainingTokens.toLocaleString()}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-600 rounded-full h-2 mt-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usagePercentage >= 100 ? 'bg-red-500' :
                      usagePercentage >= 90 ? 'bg-red-500' : 
                      usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <div className={`text-xs text-center ${isTokenLimitReached ? 'text-red-400' : 'text-gray-400'}`}>
                  {usagePercentage.toFixed(1)}% of {TOKEN_LIMIT.toLocaleString()} tokens
                </div>
                
                {isTokenLimitReached && (
                  <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300 text-center">
                    <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                    Token limit reached
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Previous Chats Section - Moved up, directly below Token Usage */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Previous Chats
            </h3>
            <div className="space-y-2">
              {mockPreviousChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                >
                  <div className="text-white text-sm font-medium mb-1 truncate">
                    Chat {chat.id}: {chat.prompt.split(' ').slice(0, 5).join(' ')}...
                  </div>
                  <div className="text-gray-400 text-xs">{chat.timestamp}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Section - Anchored at bottom with proper spacing */}
          <div className="p-4 border-t border-gray-700 mt-auto">
            <button
              onClick={() => {
                setSidebarOpen(false);
                // Navigate to settings page when implemented
                console.log('Navigate to settings');
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <Settings className="w-5 h-5 mr-2" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out pt-20 ${sidebarOpen ? 'lg:ml-72' : 'ml-0'}`}>
        <div className="flex flex-col lg:flex-row h-[calc(100vh-5rem)] gap-4 p-4 lg:gap-6 lg:p-6">
          {/* Left Panel - Controls */}
          <div className="w-full lg:w-80 bg-gray-800 rounded-lg p-4 lg:p-6 flex flex-col order-1 lg:order-1">
            {/* Token Usage Display - Mobile Only */}
            <div className={`mb-6 p-4 rounded-lg lg:hidden ${isTokenLimitReached ? 'bg-red-900/50 border border-red-500/50' : 'bg-gray-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Token Usage
                </h3>
                {tokensLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Used:</span>
                  <span className={`font-medium ${isTokenLimitReached ? 'text-red-400' : 'text-white'}`}>
                    {tokensUsed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Remaining:</span>
                  <span className={`font-medium ${remainingTokens < 100 ? 'text-red-400' : 'text-green-400'}`}>
                    {remainingTokens.toLocaleString()}
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-600 rounded-full h-2 mt-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usagePercentage >= 100 ? 'bg-red-500' :
                      usagePercentage >= 90 ? 'bg-red-500' : 
                      usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                <div className={`text-xs text-center ${isTokenLimitReached ? 'text-red-400' : 'text-gray-400'}`}>
                  {usagePercentage.toFixed(1)}% of {TOKEN_LIMIT.toLocaleString()} tokens
                </div>
                
                {isTokenLimitReached && (
                  <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300 text-center">
                    <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                    Token limit reached
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isTokenLimitReached}
                  className={`w-full bg-gray-700 text-white rounded-lg py-2 px-3 appearance-none cursor-pointer hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 ${
                    isTokenLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
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
                placeholder={isTokenLimitReached ? "Token limit reached - please contact support" : "Describe what you want to simulate..."}
                disabled={isTokenLimitReached}
                className={`w-full h-32 lg:h-48 bg-gray-700 text-white rounded-lg p-3 resize-none hover:bg-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  isTokenLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <button
              onClick={runSimulation}
              disabled={loading || !prompt.trim() || isTokenLimitReached}
              className={`py-3 px-4 rounded-lg font-semibold flex items-center justify-center mb-6 transition-colors ${
                isTokenLimitReached 
                  ? 'bg-red-500 text-white cursor-not-allowed opacity-75' 
                  : 'bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {isTokenLimitReached ? 'Token Limit Reached' : 'Run Simulation'}
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
                    disabled={isTokenLimitReached}
                    className={`p-2 hover:bg-gray-700 rounded-lg transition-colors ${
                      isTokenLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                  {showFollowUpOptions && !isTokenLimitReached && (
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
                  placeholder={isTokenLimitReached ? "Token limit reached" : "Ask a follow-up question..."}
                  disabled={isTokenLimitReached}
                  className={`flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    isTokenLimitReached ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <button
                  onClick={handleFollowUp}
                  disabled={!followUpPrompt.trim() || loading || isTokenLimitReached}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-300 w-16 flex-shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Center Panel - Simulation */}
          <div className="flex-1 bg-gray-800 rounded-lg flex flex-col overflow-hidden order-2 lg:order-2 min-h-96 lg:min-h-0">
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
                    <p className="text-lg">
                      {isTokenLimitReached 
                        ? "Token limit reached - contact support for more access"
                        : "Enter a prompt and click \"Run Simulation\" to get started"
                      }
                    </p>
                    {!isTokenLimitReached && (
                      <p className="text-sm mt-2">You have {remainingTokens.toLocaleString()} tokens remaining</p>
                    )}
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

          {/* Right Panel - Explanation */}
          <div className="w-full lg:w-80 bg-gray-800 rounded-lg flex flex-col order-3 lg:order-3">
            <div className="border-b border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Lightbulb className="w-5 h-5 mr-2" />
                Explanation
              </h2>
              <button
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="px-3 py-1.5 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors focus:ring-2 focus:ring-blue-500 text-sm ml-2"
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
                  <p className="text-gray-400">
                    {isTokenLimitReached 
                      ? "Token limit reached - upgrade for more simulations"
                      : "Run a simulation to see detailed explanations and insights"
                    }
                  </p>
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
  );
}