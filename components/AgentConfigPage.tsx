/**
 * AgentConfigPage Component
 *
 * Dedicated page for configuring an agent with three-stage wizard
 * Feature: 013-agent-config-page
 */

import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Bot,
  Shield,
  Zap,
} from 'lucide-react';
import { ConfigStepper, ConfigStage } from './agent-config/ConfigStepper';
import { BasicInfoStage } from './agent-config/BasicInfoStage';
import { PromptTemplateStage } from './agent-config/PromptTemplateStage';
import { ToolsStage } from './agent-config/ToolsStage';
import { useAgent } from '../services/hooks/useAgent';
import { AgentRole } from '../types';

const AgentConfigPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Parse agent ID from URL
  const agentId = id ? parseInt(id, 10) : NaN;

  // Stage navigation state
  const [currentStage, setCurrentStage] = useState<ConfigStage>('basicInfo');
  const [completedStages, setCompletedStages] = useState<Set<ConfigStage>>(new Set());

  // Dirty state tracking for each stage (passed from stage components)
  const [isDirty, setIsDirty] = useState(false);

  // Fetch single agent data
  const {
    agent,
    loading,
    error,
    refresh,
    handleUpdate,
    updating,
  } = useAgent({ id: agentId });

  // Handle stage change with dirty state check
  const handleStageChange = useCallback((newStage: ConfigStage) => {
    if (isDirty) {
      // TODO: Show unsaved changes dialog (Phase 6: US4)
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this stage?'
      );
      if (!confirmed) return;
    }
    setCurrentStage(newStage);
    setIsDirty(false);
  }, [isDirty]);

  // Mark stage as completed
  const markStageCompleted = useCallback((stage: ConfigStage) => {
    setCompletedStages(prev => new Set([...prev, stage]));
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    navigate(-1);
  }, [isDirty, navigate]);

  // Invalid ID state
  if (!id || isNaN(agentId)) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center">
            <AlertCircle size={48} className="text-yellow-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Invalid Agent ID</h2>
            <p className="text-sm text-slate-400 mb-6">
              The agent ID "{id}" is not valid.
            </p>
            <button
              onClick={() => navigate('/agents')}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Back to Agents
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-cyan-400 animate-spin" />
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
              Loading agent configuration...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-8 max-w-md text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Failed to Load Agent</h2>
            <p className="text-sm text-red-300 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={refresh}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
              >
                <RefreshCw size={14} /> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Agent not found
  if (!agent) {
    return (
      <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6">
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center">
            <Bot size={48} className="text-slate-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Agent Not Found</h2>
            <p className="text-sm text-slate-400 mb-6">
              The agent with ID "{id}" does not exist or has been deleted.
            </p>
            <button
              onClick={() => navigate('/agents')}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Back to Agents
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSupervisor =
    agent.role === AgentRole.GLOBAL_SUPERVISOR ||
    agent.role === AgentRole.TEAM_SUPERVISOR;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900/50">
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Back Button and Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                isSupervisor
                  ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {isSupervisor ? <Shield size={20} /> : <Zap size={20} />}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{agent.name}</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {agent.role.replace(/_/g, ' ')} Configuration
                </p>
              </div>
            </div>
          </div>

          {/* Dirty indicator */}
          {isDirty && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-950/30 border border-yellow-900/50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs text-yellow-400 font-bold">Unsaved changes</span>
            </div>
          )}
        </div>

        {/* Stepper */}
        <div className="px-6 pb-4">
          <ConfigStepper
            currentStage={currentStage}
            completedStages={completedStages}
            onStageClick={handleStageChange}
            disabled={updating}
          />
        </div>
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-auto p-6">
        {currentStage === 'basicInfo' && (
          <BasicInfoStage
            agent={agent}
            onSave={async (updates) => {
              const success = await handleUpdate(updates);
              if (success) {
                markStageCompleted('basicInfo');
                setIsDirty(false);
              }
              return success;
            }}
            onDirtyChange={setIsDirty}
            saving={updating}
          />
        )}

        {currentStage === 'promptTemplate' && (
          <PromptTemplateStage
            agent={agent}
            onSave={async (updates) => {
              const success = await handleUpdate(updates);
              if (success) {
                markStageCompleted('promptTemplate');
                setIsDirty(false);
              }
              return success;
            }}
            onDirtyChange={setIsDirty}
            saving={updating}
          />
        )}

        {currentStage === 'tools' && (
          <ToolsStage
            agent={agent}
            onDirtyChange={setIsDirty}
          />
        )}
      </div>
    </div>
  );
};

export default AgentConfigPage;
