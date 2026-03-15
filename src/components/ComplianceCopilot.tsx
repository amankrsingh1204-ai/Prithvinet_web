import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  BrainCircuit, Send, X, Loader2, AlertTriangle, 
  TrendingDown, ShieldCheck, Info, Zap, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import API_BASE from '../config/api';

interface ComplianceCopilotProps {
  industrialAreas: any[];
  pollutionAreas: any[];
  weatherData: any;
  isOpen: boolean;
  onClose: () => void;
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
const API_BASE_URL = API_BASE.replace(/\/$/, '');
const apiUrl = (path: string) => (API_BASE_URL ? `${API_BASE_URL}${path}` : path);

export const ComplianceCopilot: React.FC<ComplianceCopilotProps> = ({
  industrialAreas,
  pollutionAreas,
  weatherData,
  isOpen,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!query.trim() || isLoading) return;

    const userMessage = query;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/ai/compliance-copilot'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          industrialAreas,
          pollutionAreas,
          weatherData,
        }),
      });
      if (!response.ok) throw new Error('Failed to run compliance copilot');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data?.text || "Simulation failed to generate a response." }]);
    } catch (error) {
      console.error("Copilot error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Unable to connect to simulation engine. Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed left-2 right-2 top-20 bottom-4 md:left-auto md:right-6 md:top-24 md:bottom-24 md:w-96 z-[4200] flex flex-col bg-[#0a0c14] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <BrainCircuit className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Compliance Copilot</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">AI Simulation Engine</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-white/5 rounded-full">
                  <Zap className="w-8 h-8 text-blue-500/50" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium">Ready for Simulation</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mt-2">
                    Ask about emission reductions, temporary shutdowns, or regional risk forecasts.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full mt-4">
                  {[
                    "If Industry A reduces PM2.5 by 30%, what's the risk change next week?",
                    "Impact of shutting down top 3 high-risk units during the festival?",
                    "Predict regional AQI if wind speed doubles tomorrow."
                  ].map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => setQuery(suggestion)}
                      className="text-[10px] text-left p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-400 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-none"
                )}>
                  <div className="markdown-body">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <span className="text-[8px] text-slate-500 mt-1 uppercase font-bold tracking-widest">
                  {msg.role === 'user' ? 'Compliance Officer' : 'AI Simulation Engine'}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Running Simulation...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/5 bg-white/5">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Enter simulation query..."
                className="w-full bg-[#1a1f2e] border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none h-24"
              />
              <button
                onClick={handleSend}
                disabled={!query.trim() || isLoading}
                className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Engine Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Real-time Data Sync</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
