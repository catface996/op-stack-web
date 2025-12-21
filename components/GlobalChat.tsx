
import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Paperclip, 
  Database, 
  Network, 
  Bot, 
  User, 
  ChevronDown, 
  Search,
  Trash2,
  Sparkles,
  Maximize2,
  ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, ChatAttachment, TopologyNode, TopologyGroup, Team } from '../types';
import { streamChatResponse } from '../services/geminiService';

interface GlobalChatProps {
  nodes: TopologyNode[];
  groups: TopologyGroup[];
  teams: Team[];
  isStandalone?: boolean; // 新增：是否为独立全屏模式
}

const GlobalChat: React.FC<GlobalChatProps> = ({ nodes, groups, teams, isStandalone = false }) => {
  const [isOpen, setIsOpen] = useState(isStandalone); // Standalone 模式下默认开启
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // 尝试从本地存储恢复历史记录
    const saved = localStorage.getItem('entropy_chat_history');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'welcome', 
        role: 'assistant', 
        content: 'Hello! I am the EntropyOps Orchestrator. How can I assist you with your infrastructure today? You can attach specific resources or topologies to our conversation for deeper analysis.', 
        timestamp: Date.now() 
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [attachmentSearch, setAttachmentSearch] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 监听消息变化，持久化到本地
  useEffect(() => {
    localStorage.setItem('entropy_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const toggleAttachment = (type: 'Resource' | 'Topology', id: string, label: string) => {
    const exists = attachments.find(a => a.id === id);
    if (exists) {
      setAttachments(prev => prev.filter(a => a.id !== id));
    } else {
      setAttachments(prev => [...prev, { type, id, label }]);
      setIsAttachmentMenuOpen(false);
      setAttachmentSearch('');
      textareaRef.current?.focus();
    }
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      content: input,
      attachments: [...attachments],
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    setIsTyping(true);
    setIsAttachmentMenuOpen(false);

    let contextString = "";
    if (userMsg.attachments && userMsg.attachments.length > 0) {
      contextString = "\n\nCONTEXT FOR THIS MESSAGE:\n";
      userMsg.attachments.forEach(att => {
        if (att.type === 'Resource') {
          const node = nodes.find(n => n.id === att.id);
          contextString += `- Resource [${node?.label}]: Type=${node?.type}, Properties=${JSON.stringify(node?.properties)}\n`;
        } else {
          const group = groups.find(g => g.id === att.id);
          contextString += `- Topology [${group?.name}]: Nodes=${group?.nodeIds.join(', ')}\n`;
        }
      });
    }

    const aiMsgId = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, { 
      id: aiMsgId, 
      role: 'assistant', 
      content: '', 
      timestamp: Date.now(), 
      isStreaming: true 
    }]);

    let fullAiContent = '';
    const generator = streamChatResponse(input + contextString, messages, { nodes, groups, allTeams: teams });

    for await (const chunk of generator) {
      fullAiContent += chunk;
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullAiContent } : m));
    }

    setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m));
    setIsTyping(false);
  };

  const handleInputInteraction = () => {
    if (isAttachmentMenuOpen) setIsAttachmentMenuOpen(false);
  };

  const openFullscreen = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'chat');
    window.open(url.toString(), '_blank');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear chat history?')) {
      const welcomeMsg = messages[0];
      setMessages([welcomeMsg]);
      localStorage.removeItem('entropy_chat_history');
    }
  };

  // 独立模式样式
  const containerClasses = isStandalone 
    ? "w-full h-full bg-slate-900 flex flex-col overflow-hidden"
    : "w-96 h-[600px] mb-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300";

  const wrapperClasses = isStandalone
    ? "fixed inset-0 z-[100] bg-slate-950"
    : "fixed bottom-6 right-6 z-[100] flex flex-col items-end";

  if (isStandalone) {
    return (
      <div className={wrapperClasses}>
        <div className={containerClasses}>
          {/* Header */}
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0 px-8">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-cyan-950 rounded-xl text-cyan-400">
                <Bot size={28} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">EntropyOps System Orchestrator</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-slate-400 font-mono">Full-Spectrum Standalone Mode</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={clearHistory}
                className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 size={14} /> Clear History
              </button>
              <div className="h-6 w-px bg-slate-700 mx-2"></div>
              <button onClick={() => window.close()} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Standalone Content Area */}
          <div className="flex-1 flex overflow-hidden">
             {/* Main Chat */}
             <div className="flex-1 flex flex-col bg-slate-950/20">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar max-w-5xl mx-auto w-full">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-start gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-3 rounded-xl shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                          {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                        </div>
                        <div className={`p-5 rounded-2xl text-base leading-relaxed ${
                          msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-md'
                        }`}>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {msg.attachments.map(att => (
                                <span key={att.id} className="text-xs px-2 py-1 rounded bg-black/30 border border-white/10 flex items-center gap-1.5">
                                  {att.type === 'Resource' ? <Database size={10} /> : <Network size={10} />}
                                  {att.label}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="prose prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-600 mt-2 px-14 font-mono">
                        {new Date(msg.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-3 text-cyan-500 animate-pulse px-14">
                      <Bot size={18} />
                      <span className="text-xs font-mono tracking-wider uppercase">Neural core processing stream...</span>
                    </div>
                  )}
                </div>

                {/* Standalone Input Area */}
                <div className="p-8 bg-slate-900 border-t border-slate-800">
                  <div className="max-w-5xl mx-auto">
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {attachments.map(att => (
                          <div key={att.id} className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
                            {att.type === 'Resource' ? <Database size={12} /> : <Network size={12} />}
                            {att.label}
                            <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="ml-2 hover:text-white">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="relative flex items-end gap-4">
                      <div className="relative flex-1">
                        <button 
                          onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                          className={`absolute left-4 bottom-3 p-2 rounded-lg transition-colors ${isAttachmentMenuOpen ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                          <Paperclip size={24} />
                        </button>
                        <textarea 
                          ref={textareaRef}
                          rows={2}
                          value={input}
                          onChange={e => { setInput(e.target.value); handleInputInteraction(); }}
                          onFocus={handleInputInteraction}
                          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                          placeholder="Type your technical inquiry here... (Enter to send, Shift+Enter for new line)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-16 pr-6 text-base text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none shadow-2xl"
                        />
                        {/* Standalone Attachment Menu */}
                        {isAttachmentMenuOpen && (
                          <div className="absolute left-0 bottom-full mb-4 w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                             {/* ... 同样的菜单内容，只是稍微大一点 ... */}
                             <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                                <div className="relative">
                                  <Search className="absolute left-3 top-2.5 text-slate-600" size={16} />
                                  <input 
                                    type="text" 
                                    placeholder="Search resources or topologies..."
                                    value={attachmentSearch}
                                    onChange={e => setAttachmentSearch(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="flex-1 overflow-y-auto max-h-80 custom-scrollbar">
                                <div className="p-3 border-b border-slate-800">
                                  <div className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2">Topologies</div>
                                  {groups.filter(g => g.name.toLowerCase().includes(attachmentSearch.toLowerCase())).map(g => (
                                    <button 
                                      key={g.id}
                                      onClick={() => toggleAttachment('Topology', g.id, g.name)}
                                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between text-sm transition-colors ${attachments.find(a => a.id === g.id) ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}
                                    >
                                      <span className="flex items-center gap-3"><Network size={16}/> {g.name}</span>
                                      {attachments.find(a => a.id === g.id) && <X size={14} />}
                                    </button>
                                  ))}
                                </div>
                                <div className="p-3">
                                  <div className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2">Resources</div>
                                  {nodes.filter(n => n.label.toLowerCase().includes(attachmentSearch.toLowerCase())).map(n => (
                                    <button 
                                      key={n.id}
                                      onClick={() => toggleAttachment('Resource', n.id, n.label)}
                                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between text-sm transition-colors ${attachments.find(a => a.id === n.id) ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}
                                    >
                                      <span className="flex items-center gap-3"><Database size={16}/> {n.label}</span>
                                      {attachments.find(a => a.id === n.id) && <X size={14} />}
                                    </button>
                                  ))}
                                </div>
                              </div>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={handleSend}
                        disabled={!input.trim() && attachments.length === 0}
                        className="p-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-xl shadow-cyan-900/20"
                      >
                        <Send size={24} />
                      </button>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // 正常悬浮模式
  return (
    <div className={wrapperClasses}>
      {/* Chat Window */}
      {isOpen && (
        <div className={containerClasses}>
          {/* Header */}
          <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-950 rounded-lg text-cyan-400">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">System Orchestrator</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 font-mono">Neural Core Active</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={openFullscreen}
                className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink size={16} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/20">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-2 rounded-lg shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {msg.attachments.map(att => (
                          <span key={att.id} className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 border border-white/10 flex items-center gap-1">
                            {att.type === 'Resource' ? <Database size={8} /> : <Network size={8} />}
                            {att.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="prose prose-invert prose-xs max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-slate-600 mt-1 font-mono px-10">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-cyan-500 animate-pulse px-10">
                <Bot size={14} />
                <span className="text-[10px] font-mono tracking-tighter uppercase">Processing Stream...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 animate-in fade-in slide-in-from-bottom-2">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center gap-1 px-2 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded text-[10px] text-cyan-300">
                    {att.type === 'Resource' ? <Database size={10} /> : <Network size={10} />}
                    {att.label}
                    <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="ml-1 hover:text-white">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2">
              <div className="relative flex-1">
                <button 
                  onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                  className={`absolute left-3 bottom-2.5 p-1 rounded-md transition-colors ${isAttachmentMenuOpen ? 'text-cyan-400 bg-cyan-900/30' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Attach Context"
                >
                  <Paperclip size={18} />
                </button>
                
                <textarea 
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={e => { setInput(e.target.value); handleInputInteraction(); }}
                  onFocus={handleInputInteraction}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                  placeholder="Ask a technical question..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none max-h-32"
                />

                {isAttachmentMenuOpen && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-slate-800 bg-slate-950/50">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 text-slate-600" size={14} />
                        <input 
                          type="text" 
                          placeholder="Search items..."
                          value={attachmentSearch}
                          onChange={e => setAttachmentSearch(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded py-1.5 pl-8 pr-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-64 custom-scrollbar">
                      <div className="p-2 border-b border-slate-800">
                        <div className="text-[9px] font-bold text-slate-500 uppercase px-2 mb-1">Topologies</div>
                        {groups.filter(g => g.name.toLowerCase().includes(attachmentSearch.toLowerCase())).map(g => (
                          <button 
                            key={g.id}
                            onClick={() => toggleAttachment('Topology', g.id, g.name)}
                            className={`w-full text-left p-2 rounded flex items-center justify-between text-xs transition-colors ${attachments.find(a => a.id === g.id) ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}
                          >
                            <span className="flex items-center gap-2"><Network size={12}/> {g.name}</span>
                            {attachments.find(a => a.id === g.id) && <X size={10} />}
                          </button>
                        ))}
                      </div>
                      <div className="p-2">
                        <div className="text-[9px] font-bold text-slate-500 uppercase px-2 mb-1">Resources</div>
                        {nodes.filter(n => n.label.toLowerCase().includes(attachmentSearch.toLowerCase())).map(n => (
                          <button 
                            key={n.id}
                            onClick={() => toggleAttachment('Resource', n.id, n.label)}
                            className={`w-full text-left p-2 rounded flex items-center justify-between text-xs transition-colors ${attachments.find(a => a.id === n.id) ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'}`}
                          >
                            <span className="flex items-center gap-2"><Database size={12}/> {n.label}</span>
                            {attachments.find(a => a.id === n.id) && <X size={10} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button 
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
                className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-cyan-900/20"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 group
          ${isOpen ? 'bg-slate-800 text-cyan-400' : 'bg-cyan-600 text-white hover:bg-cyan-500'}
        `}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-20 pointer-events-none"></div>
        )}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-slate-800 shadow-xl pointer-events-none">
          {isOpen ? 'Close Chat' : 'AI Orchestrator'}
        </div>
      </button>
    </div>
  );
};

export default GlobalChat;
