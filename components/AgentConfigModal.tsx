import React, { useState } from 'react';
import { Agent, AgentConfig } from '../types';
import { Sliders, X, Save, FileText } from 'lucide-react';

// Predefined Templates for Agents (Supervisors/Workers)
export const AGENT_TEMPLATES = [
    {
        name: "Standard Coordinator",
        systemInstruction: "You are the Team Supervisor. Coordinate your workers effectively, aggregate their findings, and report a summarized status to the Global Supervisor. Ensure all tasks are completed.",
        defaultContext: "Maintain standard operational thresholds."
    },
    {
        name: "Strict Security Auditor",
        systemInstruction: "You are a Security-Focused Agent. Scrutinize all reports for potential vulnerabilities. Prioritize security warnings over performance metrics. Flag any anomalies immediately.",
        defaultContext: "Focus entirely on potential breaches and unauthorized access patterns."
    },
    {
        name: "Performance Optimizer",
        systemInstruction: "You are a Performance Tuning Lead. Identify bottlenecks, latency spikes, and resource saturation. Aggregate performance metrics and suggest optimization strategies.",
        defaultContext: "Identify top 3 performance bottlenecks."
    },
    {
        name: "Root Cause Analyst",
        systemInstruction: "You are a Diagnostic Agent. Your goal is to find the root cause of failures. Correlate logs to identify the origin of errors. Be detailed in your error reporting.",
        defaultContext: "Trace the error to its source."
    },
    {
        name: "Concise Reporter",
        systemInstruction: "You are a worker agent focused on brevity. Report only facts, metrics, and confirmed anomalies. Do not speculate.",
        defaultContext: "Output format: JSON summary only."
    }
];

interface AgentConfigModalProps {
  agent: Agent;
  onClose: () => void;
  onSave: (config: AgentConfig) => void;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({ agent, onClose, onSave }) => {
  const [formData, setFormData] = useState<AgentConfig>(agent.config || {
      model: 'gemini-2.5-flash',
      temperature: 0.5,
      systemInstruction: '',
      defaultContext: ''
  });

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const tpl = AGENT_TEMPLATES.find(t => t.name === e.target.value);
      if (tpl) {
          setFormData(prev => ({
              ...prev,
              systemInstruction: tpl.systemInstruction,
              defaultContext: tpl.defaultContext
          }));
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50 rounded-t-xl">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-cyan-950/30 rounded border border-cyan-500/20 text-cyan-400">
                <Sliders size={20} />
             </div>
             <div>
                <h3 className="font-bold text-white">Configure Agent</h3>
                <div className="text-xs text-slate-500">{agent.name}</div>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {/* Model & Temperature Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Model Selection</label>
                   <select 
                     value={formData.model}
                     onChange={e => setFormData({...formData, model: e.target.value})}
                     className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                   >
                       <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                       <option value="gemini-3-pro-preview">Gemini 3 Pro (Preview)</option>
                       <option value="gemini-2.5-flash-thinking">Gemini 2.5 Flash (Thinking)</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                       <span>Temperature</span>
                       <span className="text-cyan-400">{formData.temperature}</span>
                   </label>
                   <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={formData.temperature}
                      onChange={e => setFormData({...formData, temperature: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                   />
                   <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                       <span>Precise</span>
                       <span>Creative</span>
                   </div>
                </div>
            </div>

            <hr className="border-slate-800" />

            {/* Template Selector */}
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Apply Template</label>
                <select 
                    onChange={handleTemplateChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-300 focus:border-cyan-500 focus:outline-none"
                >
                    <option value="">Select a template to auto-fill instructions...</option>
                    {AGENT_TEMPLATES.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                </select>
            </div>

            {/* System Instruction */}
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                  <FileText size={14} /> System Instructions
               </label>
               <textarea 
                  rows={5}
                  value={formData.systemInstruction}
                  onChange={e => setFormData({...formData, systemInstruction: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none font-mono leading-relaxed"
                  placeholder="Define the core persona and rules for this agent..."
               />
            </div>

            {/* Default Context */}
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                   Default User Context / Standing Orders
               </label>
               <textarea 
                  rows={2}
                  value={formData.defaultContext}
                  onChange={e => setFormData({...formData, defaultContext: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                  placeholder="Context appended to every task (e.g., 'Always check for PII compliance')..."
               />
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-xl flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
             <button 
                onClick={() => onSave(formData)}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
             >
                <Save size={16} /> Save Configuration
             </button>
        </div>
      </div>
    </div>
  );
};