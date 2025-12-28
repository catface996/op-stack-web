import React, { useState, useMemo } from 'react';
import { Sliders, X, Save, FileText, Loader2, AlertCircle, Cpu, Thermometer, Clock } from 'lucide-react';
import StyledSelect from './ui/StyledSelect';
import { useModels } from '../services/hooks/useModels';
import { usePromptTemplates } from '../services/hooks/usePromptTemplates';
import type { AgentWithApiFields } from '../services/hooks/useAgents';
import type { UpdateAgentRequest } from '../services/api/types';

interface AgentConfigModalProps {
  agent: AgentWithApiFields;
  onClose: () => void;
  onSave: (updates: Partial<UpdateAgentRequest>) => Promise<boolean>;
  saving?: boolean;
  error?: string | null;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({ agent, onClose, onSave, saving = false, error }) => {
  // Fetch active models from API
  const { models, loading: modelsLoading, error: modelsError } = useModels({
    isActiveFilter: true,
    size: 100  // Get all active models
  });

  // Fetch prompt templates from API
  const { templates, loading: templatesLoading, error: templatesError } = usePromptTemplates({});

  // Form state - flat structure matching new API
  const [formData, setFormData] = useState({
    promptTemplateId: agent.promptTemplateId,
    model: agent.model || '',
    temperature: agent.temperature ?? 0.3,
    topP: agent.topP ?? 0.9,
    maxTokens: agent.maxTokens ?? 4096,
    maxRuntime: agent.maxRuntime ?? 300,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  // Build model options from API data
  const modelOptions = useMemo(() => {
    if (modelsLoading) {
      return [{ value: '', label: 'Loading models...' }];
    }
    if (modelsError || models.length === 0) {
      if (formData.model) {
        return [{ value: formData.model, label: formData.model }];
      }
      return [{ value: '', label: 'No models available' }];
    }

    const options = models.map(model => ({
      value: model.model_id,
      label: model.name,
      description: model.description
    }));

    // If current model is not in the list, add it as an option
    const currentModelExists = models.some(m => m.model_id === formData.model);
    if (formData.model && !currentModelExists) {
      options.unshift({
        value: formData.model,
        label: `${formData.model} (current)`,
        description: 'Currently configured model'
      });
    }

    return options;
  }, [models, modelsLoading, modelsError, formData.model]);

  // Build prompt template options from API data
  const templateOptions = useMemo(() => {
    if (templatesLoading) {
      return [{ value: '', label: 'Loading templates...' }];
    }
    if (templatesError || templates.length === 0) {
      return [{ value: '', label: 'No templates available' }];
    }

    const options = [
      { value: '', label: 'Select a prompt template...' },
      ...templates.map(template => ({
        value: String(template.id),
        label: template.name,
        description: template.description || undefined
      }))
    ];

    // If current template is not in the list, add it
    if (formData.promptTemplateId) {
      const currentExists = templates.some(t => t.id === formData.promptTemplateId);
      if (!currentExists && agent.promptTemplateName) {
        options.unshift({
          value: String(formData.promptTemplateId),
          label: `${agent.promptTemplateName} (current)`,
          description: 'Currently configured template'
        });
      }
    }

    return options;
  }, [templates, templatesLoading, templatesError, formData.promptTemplateId, agent.promptTemplateName]);

  // Validate form
  const validateForm = (): boolean => {
    if (formData.temperature < 0 || formData.temperature > 2) {
      setLocalError('Temperature must be between 0.0 and 2.0');
      return false;
    }
    if (formData.topP < 0 || formData.topP > 1) {
      setLocalError('Top P must be between 0.0 and 1.0');
      return false;
    }
    if (formData.maxTokens < 1) {
      setLocalError('Max tokens must be at least 1');
      return false;
    }
    if (formData.maxRuntime < 1) {
      setLocalError('Max runtime must be at least 1 second');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setLocalError(null);

    if (!validateForm()) {
      return;
    }

    // Build update request with only changed fields
    const updates: Partial<UpdateAgentRequest> = {};

    if (formData.promptTemplateId !== agent.promptTemplateId) {
      updates.promptTemplateId = formData.promptTemplateId;
    }
    if (formData.model !== agent.model) {
      updates.model = formData.model;
    }
    if (formData.temperature !== agent.temperature) {
      updates.temperature = formData.temperature;
    }
    if (formData.topP !== agent.topP) {
      updates.topP = formData.topP;
    }
    if (formData.maxTokens !== agent.maxTokens) {
      updates.maxTokens = formData.maxTokens;
    }
    if (formData.maxRuntime !== agent.maxRuntime) {
      updates.maxRuntime = formData.maxRuntime;
    }

    const success = await onSave(updates);
    if (success) {
      onClose();
    }
  };

  const handleTemplateSelect = (templateIdStr: string) => {
    const templateId = templateIdStr ? Number(templateIdStr) : undefined;
    setFormData({ ...formData, promptTemplateId: templateId });
  };

  const displayError = localError || error;

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
            {/* Error Banner */}
            {displayError && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-xs text-red-300">{displayError}</span>
                </div>
            )}

            {/* Prompt Template Selector */}
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                    <FileText size={14} /> Prompt Template
                    {templatesLoading && <Loader2 size={12} className="animate-spin text-cyan-400" />}
                </label>
                <StyledSelect
                    value={formData.promptTemplateId ? String(formData.promptTemplateId) : ''}
                    onChange={handleTemplateSelect}
                    options={templateOptions}
                    placeholder={templatesLoading ? "Loading templates..." : "Select a prompt template..."}
                    disabled={saving || templatesLoading}
                />
                {templatesError && (
                    <p className="text-[10px] text-red-400 mt-1">Failed to load templates</p>
                )}
                {agent.promptTemplateName && (
                    <p className="text-[10px] text-slate-500 mt-1">
                        Current: {agent.promptTemplateName}
                    </p>
                )}
            </div>

            <hr className="border-slate-800" />

            {/* Model Selection */}
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                 <Cpu size={14} /> Model Selection
                 {modelsLoading && <Loader2 size={12} className="animate-spin text-cyan-400" />}
               </label>
               <StyledSelect
                 value={formData.model}
                 onChange={(val) => setFormData({...formData, model: val})}
                 options={modelOptions}
                 placeholder={modelsLoading ? "Loading models..." : "Select model..."}
                 disabled={saving || modelsLoading}
               />
               {modelsError && (
                 <p className="text-[10px] text-red-400 mt-1">Failed to load models</p>
               )}
            </div>

            {/* Temperature & Top P Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                       <Thermometer size={14} />
                       <span>Temperature</span>
                       <span className="text-cyan-400 ml-auto">{formData.temperature.toFixed(1)}</span>
                   </label>
                   <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature}
                      onChange={e => setFormData({...formData, temperature: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
                      disabled={saving}
                   />
                   <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                       <span>Precise (0.0)</span>
                       <span>Creative (2.0)</span>
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                       <span>Top P</span>
                       <span className="text-cyan-400">{formData.topP.toFixed(1)}</span>
                   </label>
                   <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.topP}
                      onChange={e => setFormData({...formData, topP: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-50"
                      disabled={saving}
                   />
                   <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                       <span>Focused (0.0)</span>
                       <span>Diverse (1.0)</span>
                   </div>
                </div>
            </div>

            {/* Max Tokens & Max Runtime Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                       Max Output Tokens
                   </label>
                   <input
                      type="number"
                      min="1"
                      max="100000"
                      value={formData.maxTokens}
                      onChange={e => setFormData({...formData, maxTokens: parseInt(e.target.value) || 1})}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      disabled={saving}
                   />
                   <p className="text-[10px] text-slate-600 mt-1">Maximum tokens in response</p>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                       <Clock size={14} /> Max Runtime (seconds)
                   </label>
                   <input
                      type="number"
                      min="1"
                      max="3600"
                      value={formData.maxRuntime}
                      onChange={e => setFormData({...formData, maxRuntime: parseInt(e.target.value) || 1})}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
                      disabled={saving}
                   />
                   <p className="text-[10px] text-slate-600 mt-1">Maximum execution time</p>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50 rounded-b-xl flex justify-end gap-3">
             <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
             >
                Cancel
             </button>
             <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded shadow-lg shadow-cyan-900/20 transition-all flex items-center gap-2"
             >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Configuration'}
             </button>
        </div>
      </div>
    </div>
  );
};
