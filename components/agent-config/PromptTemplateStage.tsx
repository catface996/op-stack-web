/**
 * PromptTemplateStage Component
 *
 * Stage 2 of agent configuration: Select and preview prompt template
 * Feature: 013-agent-config-page
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Check,
  Loader2,
  AlertCircle,
  Eye,
  Inbox,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
} from 'lucide-react';
import type { AgentWithApiFields } from '../../services/hooks/useAgents';
import { usePromptTemplates } from '../../services/hooks/usePromptTemplates';
import { usePromptTemplate } from '../../services/hooks/usePromptTemplate';
import type { UpdateAgentRequest, PromptTemplateDTO } from '../../services/api/types';
import { getUsageIcon, getUsageStyle } from '../prompt/promptIcons';

interface PromptTemplateStageProps {
  agent: AgentWithApiFields;
  onSave: (updates: Partial<UpdateAgentRequest>) => Promise<boolean>;
  onDirtyChange: (isDirty: boolean) => void;
  saving: boolean;
}

export const PromptTemplateStage: React.FC<PromptTemplateStageProps> = ({
  agent,
  onSave,
  onDirtyChange,
  saving,
}) => {
  // Search keyword
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // Selected template (for saving)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    agent.promptTemplateId ?? null
  );

  // Preview panel state - always show panel
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(
    agent.promptTemplateId ?? null
  );

  // Save error
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch templates list
  const {
    templates,
    pagination,
    loading: templatesLoading,
    error: templatesError,
    setPage,
  } = usePromptTemplates({ keyword: debouncedKeyword });

  // Fetch preview template detail
  const {
    template: previewTemplate,
    loading: previewLoading,
  } = usePromptTemplate(previewTemplateId);

  // Debounce search keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Sync selected template with agent prop
  useEffect(() => {
    setSelectedTemplateId(agent.promptTemplateId ?? null);
  }, [agent.promptTemplateId]);

  // Calculate dirty state
  const isDirty = useMemo(() => {
    return selectedTemplateId !== (agent.promptTemplateId ?? null);
  }, [selectedTemplateId, agent.promptTemplateId]);

  // Notify parent of dirty state
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // Handle template card click - open preview
  const handleTemplateClick = (template: PromptTemplateDTO) => {
    setPreviewTemplateId(template.id);
  };

  // Handle select template from preview panel - directly save
  const handleSelectTemplate = async (templateId: number) => {
    setSaveError(null);
    const updates: Partial<UpdateAgentRequest> = {
      promptTemplateId: templateId,
    };
    const success = await onSave(updates);
    if (success) {
      setSelectedTemplateId(templateId);
    } else {
      setSaveError('Failed to save changes. Please try again.');
    }
  };

  // Handle clear selection
  const handleClearSelection = async () => {
    setSaveError(null);
    const updates: Partial<UpdateAgentRequest> = {
      promptTemplateId: undefined,
    };
    const success = await onSave(updates);
    if (success) {
      setSelectedTemplateId(null);
      setPreviewTemplateId(null);
    } else {
      setSaveError('Failed to clear selection. Please try again.');
    }
  };

  // Find selected template info
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="flex h-full gap-4">
      {/* Main Content - Template List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Prompt Template</h2>
            {selectedTemplateId && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-950/30 border border-green-900/50 rounded-lg">
                <Check size={14} className="text-green-400" />
                <span className="text-xs text-green-400 font-bold">
                  {selectedTemplate?.name || agent.promptTemplateName || `Template #${selectedTemplateId}`}
                </span>
                <button
                  onClick={handleClearSelection}
                  className="ml-1 p-0.5 hover:bg-green-900/30 rounded"
                  title="Clear selection"
                >
                  <X size={12} className="text-green-400" />
                </button>
              </div>
            )}
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-auto">
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="text-cyan-400 animate-spin" />
              </div>
            ) : templatesError ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle size={32} className="text-red-400 mb-2" />
                <p className="text-sm text-red-400">{templatesError}</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Inbox size={48} className="text-slate-700 mb-3" />
                <p className="text-sm text-slate-500 font-bold">No templates found</p>
                <p className="text-xs text-slate-600 mt-1">
                  {searchKeyword ? 'Try a different search term' : 'No prompt templates available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={template.id === selectedTemplateId}
                    isPreviewing={template.id === previewTemplateId}
                    onClick={() => handleTemplateClick(template)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center items-center gap-6">
              <button
                onClick={() => setPage(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 tracking-widest">Page</span>
                <span className="text-xs text-white bg-slate-800 px-2 py-0.5 rounded font-mono font-bold">{pagination.page}</span>
                <span className="text-[10px] text-slate-500 font-bold">/</span>
                <span className="text-xs text-slate-400 font-mono font-bold">{pagination.totalPages}</span>
              </div>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page === pagination.totalPages}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 disabled:opacity-30 hover:bg-slate-800 text-slate-300 transition-all font-bold text-xs"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}

          {/* Save Error */}
          {saveError && (
            <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
              <p className="text-xs text-red-400 flex items-center gap-2">
                <AlertCircle size={14} /> {saveError}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel - Always visible */}
      <div className="w-96 shrink-0">
        <TemplatePreviewPanel
          template={previewTemplate}
          loading={previewLoading}
          isSelected={previewTemplateId === selectedTemplateId}
          onSelect={() => previewTemplateId && handleSelectTemplate(previewTemplateId)}
          saving={saving}
        />
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: PromptTemplateDTO;
  isSelected: boolean;
  isPreviewing: boolean;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  isPreviewing,
  onClick,
}) => {
  const UsageIcon = getUsageIcon(template.usageName);
  const style = getUsageStyle(template.usageName);
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col h-full ${
        isSelected
          ? 'bg-green-950/30 border-green-500/50 shadow-lg shadow-green-900/10'
          : isPreviewing
            ? 'bg-slate-800/50 border-cyan-500/50'
            : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg shrink-0 ${style.bg} ${style.text}`}>
          <UsageIcon size={14} />
        </div>
        <h3 className={`text-[11px] font-bold leading-tight line-clamp-1 flex-1 min-w-0 ${
          isSelected ? 'text-green-300' : 'text-slate-200'
        }`}>
          {template.name}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          {isSelected && (
            <Check size={14} className="text-green-400" />
          )}
          <Eye size={12} className="text-slate-600" />
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-[10px] text-slate-500 line-clamp-2 mb-2 flex-1">
          {template.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800/50">
        <span className="text-[9px] text-slate-600">v{template.currentVersion}</span>
        {template.usageName && (
          <span className={`px-1.5 py-0.5 ${style.bg} ${style.text} text-[9px] rounded truncate max-w-[80px]`}>
            {template.usageName}
          </span>
        )}
      </div>
    </button>
  );
};

// Template Preview Panel Component
interface TemplatePreviewPanelProps {
  template: import('../../services/api/types').PromptTemplateDetailDTO | null;
  loading: boolean;
  isSelected: boolean;
  onSelect: () => void;
  saving?: boolean;
}

const TemplatePreviewPanel: React.FC<TemplatePreviewPanelProps> = ({
  template,
  loading,
  isSelected,
  onSelect,
  saving,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl h-full flex flex-col overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800 shrink-0">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Eye size={16} className="text-cyan-400" />
          Template Preview
        </h3>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="text-cyan-400 animate-spin" />
          </div>
        ) : !template ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText size={48} className="text-slate-700 mb-3" />
            <p className="text-sm text-slate-500 font-bold">No template selected</p>
            <p className="text-xs text-slate-600 mt-1">
              Click a template to preview
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Template Info */}
            <div>
              <h4 className="text-base font-bold text-white mb-1">{template.name}</h4>
              {template.description && (
                <p className="text-xs text-slate-400">{template.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                <span>Version {template.currentVersion}</span>
                {template.usageName && (
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded">
                    {template.usageName}
                  </span>
                )}
              </div>
            </div>

            {/* Template Content */}
            <div className="border-t border-slate-800 pt-4">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Content
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {template.content || 'No content available'}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Footer */}
      {template && (
        <div className="p-4 border-t border-slate-800 shrink-0">
          {isSelected ? (
            <div className="flex items-center justify-center gap-2 py-2 text-green-400">
              <Check size={16} />
              <span className="text-xs font-bold">Currently Selected</span>
            </div>
          ) : (
            <button
              onClick={onSelect}
              disabled={saving}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving...' : 'Select This Template'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptTemplateStage;
