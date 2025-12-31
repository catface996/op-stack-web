/**
 * BasicInfoStage Component
 *
 * Stage 1 of agent configuration: Basic information and model settings
 * Feature: 013-agent-config-page
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import type { AgentWithApiFields } from '../../services/hooks/useAgents';
import { useModels } from '../../services/hooks/useModels';
import type { UpdateAgentRequest } from '../../services/api/types';

interface BasicInfoStageProps {
  agent: AgentWithApiFields;
  onSave: (updates: Partial<UpdateAgentRequest>) => Promise<boolean>;
  onDirtyChange: (isDirty: boolean) => void;
  saving: boolean;
}

interface FormData {
  name: string;
  specialty: string;
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
  maxRuntime: number;
}

interface ValidationErrors {
  name?: string;
  temperature?: string;
  topP?: string;
  maxTokens?: string;
  maxRuntime?: string;
}

export const BasicInfoStage: React.FC<BasicInfoStageProps> = ({
  agent,
  onSave,
  onDirtyChange,
  saving,
}) => {
  // Fetch available models
  const { models, loading: modelsLoading } = useModels({
    size: 100,
    isActiveFilter: true
  });

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: agent.name,
    specialty: agent.specialty || '',
    model: agent.model || '',
    temperature: agent.temperature ?? 0.7,
    topP: agent.topP ?? 0.9,
    maxTokens: agent.maxTokens ?? 4096,
    maxRuntime: agent.maxRuntime ?? 300,
  });

  // Validation errors
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync form state with agent prop when it changes (e.g., after save)
  useEffect(() => {
    setFormData({
      name: agent.name,
      specialty: agent.specialty || '',
      model: agent.model || '',
      temperature: agent.temperature ?? 0.7,
      topP: agent.topP ?? 0.9,
      maxTokens: agent.maxTokens ?? 4096,
      maxRuntime: agent.maxRuntime ?? 300,
    });
  }, [agent.id, agent.name, agent.specialty, agent.model, agent.temperature, agent.topP, agent.maxTokens, agent.maxRuntime]);

  // Calculate dirty state
  const isDirty = useMemo(() => {
    return (
      formData.name !== agent.name ||
      formData.specialty !== (agent.specialty || '') ||
      formData.model !== (agent.model || '') ||
      formData.temperature !== (agent.temperature ?? 0.7) ||
      formData.topP !== (agent.topP ?? 0.9) ||
      formData.maxTokens !== (agent.maxTokens ?? 4096) ||
      formData.maxRuntime !== (agent.maxRuntime ?? 300)
    );
  }, [formData, agent]);

  // Notify parent of dirty state changes
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Agent name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (formData.temperature < 0 || formData.temperature > 2) {
      newErrors.temperature = 'Temperature must be between 0 and 2';
    }

    if (formData.topP < 0 || formData.topP > 1) {
      newErrors.topP = 'Top P must be between 0 and 1';
    }

    if (formData.maxTokens < 1) {
      newErrors.maxTokens = 'Max tokens must be at least 1';
    }

    if (formData.maxRuntime < 1) {
      newErrors.maxRuntime = 'Max runtime must be at least 1 second';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setSaveError(null);
  };

  // Handle save
  const handleSave = async () => {
    if (!validate()) return;

    setSaveError(null);
    const updates: Partial<UpdateAgentRequest> = {
      name: formData.name.trim(),
      specialty: formData.specialty.trim() || undefined,
      model: formData.model || undefined,
      temperature: formData.temperature,
      topP: formData.topP,
      maxTokens: formData.maxTokens,
      maxRuntime: formData.maxRuntime,
    };

    const success = await onSave(updates);
    if (!success) {
      setSaveError('Failed to save changes. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-6">Basic Information</h2>

        <div className="space-y-5">
          {/* Agent Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Agent Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none transition-colors ${
                errors.name
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-slate-700 focus:border-cyan-500/50'
              }`}
              placeholder="Enter agent name"
              disabled={saving}
              maxLength={100}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.name}
              </p>
            )}
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Specialty
            </label>
            <input
              type="text"
              value={formData.specialty}
              onChange={(e) => handleChange('specialty', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
              placeholder="Enter specialty (optional)"
              disabled={saving}
              maxLength={200}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800 pt-5">
            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
              <Info size={14} className="text-cyan-400" />
              Model Configuration
            </h3>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Model
            </label>
            <select
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
              disabled={saving || modelsLoading}
            >
              <option value="">Select a model</option>
              {models.map((model) => (
                <option key={model.id} value={model.model_id}>
                  {model.name} ({model.model_id})
                </option>
              ))}
              {/* Show current model if not in list */}
              {formData.model && !models.some(m => m.model_id === formData.model) && (
                <option value={formData.model}>
                  {formData.model} (current)
                </option>
              )}
            </select>
            {modelsLoading && (
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Loading models...
              </p>
            )}
          </div>

          {/* Temperature and TopP in row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Temperature */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Temperature (0-2)
              </label>
              <input
                type="number"
                value={formData.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || 0)}
                className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none transition-colors ${
                  errors.temperature
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-slate-700 focus:border-cyan-500/50'
                }`}
                min={0}
                max={2}
                step={0.1}
                disabled={saving}
              />
              {errors.temperature && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.temperature}
                </p>
              )}
            </div>

            {/* Top P */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Top P (0-1)
              </label>
              <input
                type="number"
                value={formData.topP}
                onChange={(e) => handleChange('topP', parseFloat(e.target.value) || 0)}
                className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none transition-colors ${
                  errors.topP
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-slate-700 focus:border-cyan-500/50'
                }`}
                min={0}
                max={1}
                step={0.1}
                disabled={saving}
              />
              {errors.topP && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.topP}
                </p>
              )}
            </div>
          </div>

          {/* Max Tokens and Max Runtime in row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Max Tokens */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={formData.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 1)}
                className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none transition-colors ${
                  errors.maxTokens
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-slate-700 focus:border-cyan-500/50'
                }`}
                min={1}
                disabled={saving}
              />
              {errors.maxTokens && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.maxTokens}
                </p>
              )}
            </div>

            {/* Max Runtime */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Max Runtime (seconds)
              </label>
              <input
                type="number"
                value={formData.maxRuntime}
                onChange={(e) => handleChange('maxRuntime', parseInt(e.target.value) || 1)}
                className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none transition-colors ${
                  errors.maxRuntime
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-slate-700 focus:border-cyan-500/50'
                }`}
                min={1}
                disabled={saving}
              />
              {errors.maxRuntime && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.maxRuntime}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save Error */}
        {saveError && (
          <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
            <p className="text-xs text-red-400 flex items-center gap-2">
              <AlertCircle size={14} /> {saveError}
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving || Object.keys(errors).length > 0}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-lg transition-colors shadow-lg shadow-cyan-900/20 flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStage;
