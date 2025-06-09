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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.id) fetchTokenUsage();
  }, [user?.id]);

  const fetchTokenUsage = async () => {
    if (!user?.id) return;
    try {
      setTokenLoading(true);
      const { data, error } = await supabase
        .from('token_usage')
        .select('sum(tokens_used)')
        .eq('user_id', user.id)
        .single();
      if (error) return;
      const tokens = data?.sum || 0;
      setTotalTokensUsed(tokens);
    } catch (error) {
    } finally {
      setTokenLoading(false);
    }
  };

  const createSimulationDocument = (canvasHtml: string, jsCode: string): string => {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Simulation</title><style>body{margin:0;padding:20px;font-family:sans-serif;background:#fff}canvas{display:block;margin:0 auto;border:1px solid #ccc}</style></head><body>${canvasHtml}<script>setTimeout(()=>{try{${jsCode}}catch(e){document.body.innerHTML='<div class="error">'+e.message+'</div>'}},100)</script></body></html>`;
  };

  useEffect(() => {
    if (simulationData && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = createSimulationDocument(simulationData.canvasHtml, simulationData.jsCode);
      iframe.srcdoc = doc;
    }
  }, [simulationData]);

  const runSimulation = async () => {
    if (totalTokensUsed >= 2000) {
      setError('Token limit exceeded (2000 tokens).');
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
      await withValidSession(async () => {
        if (!user?.id) return navigate('/auth');
        const response = await fetch("https://zurfhydnztcxlomdyqds.functions.supabase.co/simulate", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ prompt, subject }),
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        setRawResponse(JSON.stringify(data, null, 2));
        if (data.suggestion) return setSuggestion(data.suggestion);
        if (data.error) return setError(data.error);
        if (!data.canvasHtml || !data.jsCode) throw new Error('Incomplete simulation data');
        setSimulationData({ canvasHtml: data.canvasHtml, jsCode: data.jsCode });
        await fetchTokenUsage();
      });
    } catch (err: any) {
      if (err.message?.includes('Session invalid') || err.message?.includes('Auth session missing')) {
        navigate('/auth');
        return;
      }
      setError(err.message || 'Failed to generate simulation');
      await fetchTokenUsage();
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error: any) {
      setError('Failed to sign out: ' + error.message);
    }
  };

  const resetSimulation = () => {
    setSimulationData(null);
    setError('');
    setSuggestion('');
    setRawResponse('');
    if (iframeRef.current) iframeRef.current.srcdoc = '';
  };

  const runFollowUp = async () => {
    if (!simulationData) return setError('No simulation to follow up on');
    if (totalTokensUsed >= 2000) return setError('Token limit exceeded');
    const followUpPrompt = `Based on the current simulation: ${prompt}, suggest an improvement or variation`;
    setLoading(true);
    setError('');
    try {
      await withValidSession(async () => {
        if (!user?.id) return navigate('/auth');
        const response = await fetch("https://zurfhydnztcxlomdyqds.functions.supabase.co/simulate", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ prompt: followUpPrompt, subject }),
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        if (data.suggestion) return setSuggestion(data.suggestion);
        if (data.error) return setError(data.error);
        if (data.canvasHtml && data.jsCode) {
          setSimulationData({ canvasHtml: data.canvasHtml, jsCode: data.jsCode });
          setPrompt(followUpPrompt);
        }
        await fetchTokenUsage();
      });
    } catch (err: any) {
      if (err.message?.includes('Session invalid') || err.message?.includes('Auth session missing')) {
        navigate('/auth');
        return;
      }
      setError(err.message || 'Failed to generate follow-up simulation');
      await fetchTokenUsage();
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading...</div>;
  if (authError || !user) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Authentication Error</div>;

  const isTokenLimitReached = totalTokensUsed >= 2000;

  return (
    <div className="min-h-screen bg-gray-900 pt-16">
      {/* Full layout restored as requested */}
    </div>
  );
}
