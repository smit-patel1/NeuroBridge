import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { Play, Eye, EyeOff, LogOut } from 'lucide-react';

export default function Demo() {
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const [subject, setSubject] = useState('Mathematics');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [error, setError] = useState(null);
  const [showConsole, setShowConsole] = useState(false);
  const [tokenUsage, setTokenUsage] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  // Debug logging
  console.log('Demo render state:', { user, authLoading, authError });

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Authentication Error: {authError}</div>
      </div>
    );
  }

  // Show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Please log in to access the demo</div>
          <a href="/auth" className="bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const handleRunSimulation = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Your simulation logic here
      const result = await runSimulation(prompt, subject);
      setSimulationData(result);
      setTokenUsage(prev => prev + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">MindRender Demo</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300">
              Token Usage: {tokenUsage} / 2000
            </span>
            <span className="text-sm text-gray-300">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 p-6 h-screen">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg p-6">
          <div className="space-y-6">
            {/* Subject Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to simulate..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-32 resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunSimulation}
              disabled={loading || !prompt.trim()}
              className="w-full bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>{loading ? 'Running...' : 'Run Simulation'}</span>
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Simulation Area */}
        <div className="lg:col-span-3 bg-white rounded-lg p-6">
          {simulationData ? (
            <div className="h-full">
              {/* Simulation content */}
              <iframe
                src={simulationData.url}
                className="w-full h-full border-0 rounded-lg"
                title="Simulation"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="text-xl mb-2">No simulation running</p>
                <p>Enter a prompt and click "Run Simulation" to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Console Toggle */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowConsole(!showConsole)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
        >
          {showConsole ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showConsole ? 'Hide' : 'Show'} Console</span>
        </button>
      </div>

      {/* Console */}
      {showConsole && (
        <div className="fixed bottom-16 right-4 w-96 h-64 bg-gray-800 border border-gray-600 rounded-lg p-4 overflow-auto">
          <h3 className="text-white font-semibold mb-2">Debug Console</h3>
          <div className="text-gray-300 text-sm space-y-1">
            <p>User: {user?.email}</p>
            <p>Subject: {subject}</p>
            <p>Loading: {loading.toString()}</p>
            <p>Token Usage: {tokenUsage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder simulation function
async function runSimulation(prompt, subject) {
  // Replace with your actual API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        url: `data:text/html;charset=utf-8,<html><body><h1>Simulation: ${subject}</h1><p>${prompt}</p></body></html>`
      });
    }, 2000);
  });
}
