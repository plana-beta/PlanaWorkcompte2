import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, MessageCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

export function CoachChat() {
  const { chatHistory, sendMessageToCoach } = useAppStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const text = inputText;
    setInputText('');
    setIsTyping(true);
    
    await sendMessageToCoach(text);
    
    setIsTyping(false);
  };

  const quickActions = [
    "Pourquoi cette séance ?",
    "Comment va ma forme ?",
    "Que dois-je faire aujourd'hui ?"
  ];

  if (!isOpen) {
    return (
      <div className="mt-8">
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-blue-50 border border-blue-200/50 rounded-3xl p-5 flex items-center justify-between text-left shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
               <Sparkles size={20} />
             </div>
             <div>
               <h4 className="text-sm font-black text-blue-900">Demander au Coach</h4>
               <p className="text-xs font-medium text-blue-700/70 mt-0.5">Pose une question sur ton entraînement</p>
             </div>
          </div>
          <MessageCircle size={20} className="text-blue-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[400px]">
      <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-blue-500" />
          <h3 className="font-bold text-sm text-blue-900 uppercase tracking-wider">Coach Plana</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-xs font-bold text-blue-500 uppercase tracking-wider">Fermer</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        <AnimatePresence initial={false}>
          {chatHistory.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-4">
               <p className="text-sm text-slate-500 font-medium mb-4">Pose-moi une question sur ton plan, ta forme ou ta séance du jour.</p>
               <div className="flex flex-wrap gap-2 justify-center">
                 {quickActions.map(action => (
                   <button 
                     key={action} 
                     onClick={() => setInputText(action)}
                     className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-slate-600 shadow-sm active:scale-95 transition-transform"
                   >
                     {action}
                   </button>
                 ))}
               </div>
            </motion.div>
          )}

          {chatHistory.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex w-full", msg.sender === 'user' ? "justify-end" : "justify-start")}
            >
              <div className={cn(
                "max-w-[85%] rounded-2xl p-3 text-sm font-medium leading-relaxed shadow-sm",
                msg.sender === 'user' 
                  ? "bg-plana-black text-white rounded-tr-sm" 
                  : "bg-white border border-gray-100 text-plana-black rounded-tl-sm"
              )}>
                {msg.text}
                
                {msg.intent?.type === 'REQUEST_WORKOUT_SUBSTITUTION' && (
                  <div className="mt-3 pt-3 border-t border-gray-100/20 flex gap-2">
                     <button className="flex-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl">Appliquer</button>
                     <button className="flex-1 bg-gray-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl">Annuler</button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex w-full justify-start">
               <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1 items-center">
                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </motion.div>
          )}
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>

      <div className="p-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex items-center gap-2 relative">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Pose une question..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-plana-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="w-11 h-11 rounded-xl bg-plana-black text-white flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform"
          >
            <Send size={16} className="-ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
