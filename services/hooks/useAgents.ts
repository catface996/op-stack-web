/**
 * useAgents Hook
 *
 * Fetch and manage agent list with pagination, loading, error states
 * Feature: 012-agent-api-integration
 */

import { useState, useEffect, useCallback } from 'react';
import { listAgents, createAgent, updateAgent, deleteAgent } from '../api/agents';
import type {
  AgentDTO,
  AgentRoleDTO,
  ListAgentsRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
} from '../api/types';
import { Agent, AgentRole, AgentStatus } from '../../types';

const DEFAULT_PAGE_SIZE = 8;

// ============================================================================
// Type Conversion Helpers
// ============================================================================

/**
 * Convert backend role code to frontend AgentRole enum
 */
export function fromApiRole(roleDTO: AgentRoleDTO): AgentRole {
  const mapping: Record<AgentRoleDTO, AgentRole> = {
    'GLOBAL_SUPERVISOR': AgentRole.GLOBAL_SUPERVISOR,
    'TEAM_SUPERVISOR': AgentRole.TEAM_SUPERVISOR,
    'WORKER': AgentRole.WORKER,
    'SCOUTER': AgentRole.SCOUTER,
  };
  return mapping[roleDTO] || AgentRole.WORKER;
}

/**
 * Convert frontend AgentRole enum to backend role code
 */
export function toApiRole(role: AgentRole): AgentRoleDTO {
  const mapping: Record<AgentRole, AgentRoleDTO> = {
    [AgentRole.GLOBAL_SUPERVISOR]: 'GLOBAL_SUPERVISOR',
    [AgentRole.TEAM_SUPERVISOR]: 'TEAM_SUPERVISOR',
    [AgentRole.WORKER]: 'WORKER',
    [AgentRole.SCOUTER]: 'SCOUTER',
  };
  return mapping[role] || 'WORKER';
}

// ============================================================================
// Extended Agent Type for UI (includes API-only fields)
// ============================================================================

/**
 * Agent with all API fields (flat structure matching new API)
 */
export interface AgentWithApiFields extends Agent {
  /** Prompt template ID */
  promptTemplateId?: number;
  /** Prompt template name (read-only) */
  promptTemplateName?: string;
  /** AI model identifier */
  model?: string;
  /** Temperature parameter (0.0-2.0) */
  temperature?: number;
  /** Top P parameter (0.0-1.0) */
  topP?: number;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Maximum runtime in seconds */
  maxRuntime?: number;
  /** Array of assigned tool IDs (UUID strings) */
  toolIds: string[];
  /** IDs of teams this agent belongs to */
  teamIds: number[];
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Convert backend AgentDTO to frontend AgentWithApiFields type
 */
export function toFrontendAgent(dto: AgentDTO): AgentWithApiFields {
  return {
    id: String(dto.id),
    name: dto.name,
    role: fromApiRole(dto.role),
    specialty: dto.specialty,
    status: AgentStatus.IDLE, // Default status (not in new API response)
    findings: {
      warnings: dto.warnings,
      critical: dto.critical,
    },
    // Flat config fields (new API structure)
    promptTemplateId: dto.promptTemplateId,
    promptTemplateName: dto.promptTemplateName,
    model: dto.model,
    temperature: dto.temperature,
    topP: dto.topP,
    maxTokens: dto.maxTokens,
    maxRuntime: dto.maxRuntime,
    toolIds: dto.toolIds || [],
    // Additional fields
    teamIds: dto.teamIds || [],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

// ============================================================================
// useAgents Hook
// ============================================================================

interface UseAgentsOptions {
  page?: number;
  size?: number;
  role?: AgentRoleDTO;
  teamId?: number;
  keyword?: string;
}

interface UseAgentsResult {
  agents: AgentWithApiFields[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  roleFilter: AgentRoleDTO | undefined;
  keyword: string;
  setPage: (page: number) => void;
  setRoleFilter: (role: AgentRoleDTO | undefined) => void;
  setKeyword: (keyword: string) => void;
  refresh: () => void;
  handleCreate: (name: string, specialty?: string) => Promise<AgentWithApiFields | null>;
  handleUpdate: (id: string, updates: Partial<UpdateAgentRequest>) => Promise<boolean>;
  handleDelete: (id: string) => Promise<boolean>;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

export function useAgents(options: UseAgentsOptions = {}): UseAgentsResult {
  const [agents, setAgents] = useState<AgentWithApiFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(options.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilterState] = useState<AgentRoleDTO | undefined>(options.role);
  const [keyword, setKeywordState] = useState(options.keyword ?? '');
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const pageSize = options.size ?? DEFAULT_PAGE_SIZE;

    try {
      // Constitution: API Pagination Request Format
      const request: ListAgentsRequest = {
        page: page,
        size: pageSize,
      };

      // Only add optional filters if explicitly set
      if (roleFilter !== undefined) {
        request.role = roleFilter;
      }
      if (options.teamId !== undefined) {
        request.teamId = options.teamId;
      }
      if (keyword.trim()) {
        request.keyword = keyword.trim();
      }

      console.log('[useAgents] Fetching agents with request:', request);
      const response = await listAgents(request);
      console.log('[useAgents] Response:', response);

      // Constitution: API Pagination Response Format - extract from data.content
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        const convertedAgents = (response.data.content || []).map(toFrontendAgent);
        setAgents(convertedAgents);
        setTotal(response.data.totalElements || 0);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setError(response.message || 'Failed to load agent list');
        setAgents([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load agent list';
      setError(message);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, keyword, options.size, options.teamId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const refresh = useCallback(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSetRoleFilter = useCallback((newRole: AgentRoleDTO | undefined) => {
    setRoleFilterState(newRole);
    setPage(1); // Reset to first page when filter changes
  }, []);

  const handleSetKeyword = useCallback((newKeyword: string) => {
    setKeywordState(newKeyword);
    setPage(1); // Reset to first page when search changes
  }, []);

  const handleCreate = useCallback(async (
    name: string,
    specialty?: string
  ): Promise<AgentWithApiFields | null> => {
    setCreating(true);
    setError(null);
    try {
      const request: CreateAgentRequest = {
        name,
        role: 'WORKER', // Default role for new agents
      };
      if (specialty) {
        request.specialty = specialty;
      }

      const response = await createAgent(request);
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        const newAgent = toFrontendAgent(response.data);
        // Refresh the list after successful creation
        await fetchAgents();
        return newAgent;
      } else {
        setError(response.message || 'Failed to create agent');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create agent';
      setError(message);
      return null;
    } finally {
      setCreating(false);
    }
  }, [fetchAgents]);

  /**
   * Update agent (unified - basic info + LLM config)
   * @param id Agent ID
   * @param updates Partial update fields (name, specialty, promptTemplateId, model, temperature, topP, maxTokens, maxRuntime)
   */
  const handleUpdate = useCallback(async (
    id: string,
    updates: Partial<UpdateAgentRequest>
  ): Promise<boolean> => {
    setUpdating(true);
    setError(null);
    try {
      const request: UpdateAgentRequest = {
        id: Number(id),
        ...updates,
      };
      // Remove id from updates if present (already set above)
      delete (request as Partial<UpdateAgentRequest>).id;
      request.id = Number(id);

      const response = await updateAgent(request);
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess) {
        // Refresh the list after successful update
        await fetchAgents();
        return true;
      } else {
        setError(response.message || 'Failed to update agent');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update agent';
      setError(message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [fetchAgents]);

  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true);
    setError(null);
    try {
      const response = await deleteAgent({ id: Number(id) });
      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess) {
        // Refresh the list after successful deletion
        await fetchAgents();
        return true;
      } else {
        setError(response.message || 'Failed to delete agent');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete agent';
      setError(message);
      return false;
    } finally {
      setDeleting(false);
    }
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    page,
    totalPages,
    total,
    roleFilter,
    keyword,
    setPage: handleSetPage,
    setRoleFilter: handleSetRoleFilter,
    setKeyword: handleSetKeyword,
    refresh,
    handleCreate,
    handleUpdate,
    handleDelete,
    creating,
    updating,
    deleting,
  };
}
