/**
 * useNodeAgents Hook
 *
 * Manage agents bound to a node
 * Updated for Feature 040: Uses unified agent-bounds API
 */

import { useState, useEffect, useCallback } from 'react';
import { agentBoundsApi, type AgentBoundDTO } from '../api/agentBounds';
import type { AgentDTO } from '../api/types';

interface UseNodeAgentsResult {
  /** Agents bound to the node (converted to AgentDTO format for compatibility) */
  agents: AgentDTO[];
  /** Raw bound agent data with full binding info */
  boundAgents: AgentBoundDTO[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  bindAgent: (agentId: number) => Promise<boolean>;
  unbindAgent: (agentId: number) => Promise<boolean>;
  binding: boolean;
}

/**
 * Convert AgentBoundDTO to AgentDTO for backward compatibility
 */
function toAgentDTO(bound: AgentBoundDTO): AgentDTO {
  return {
    id: bound.agentId,
    name: bound.agentName,
    role: bound.agentRole as AgentDTO['role'],
    hierarchyLevel: bound.hierarchyLevel as AgentDTO['hierarchyLevel'],
    specialty: '',
    model: '',
    warnings: 0,
    critical: 0,
    teamIds: [],
    createdAt: bound.createdAt,
    updatedAt: bound.createdAt,
  };
}

export function useNodeAgents(nodeId: number): UseNodeAgentsResult {
  const [boundAgents, setBoundAgents] = useState<AgentBoundDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [binding, setBinding] = useState(false);

  const fetchAgents = useCallback(async () => {
    if (!nodeId) return;

    setLoading(true);
    setError(null);
    try {
      // Use new unified API: query-by-entity
      const result = await agentBoundsApi.queryByEntity({
        entityType: 'NODE',
        entityId: nodeId,
      });
      setBoundAgents(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
      setBoundAgents([]);
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const bindAgent = useCallback(async (agentId: number): Promise<boolean> => {
    setBinding(true);
    setError(null);
    try {
      // Use new unified API: bind
      await agentBoundsApi.bind({
        agentId,
        entityId: nodeId,
        entityType: 'NODE',
      });
      await fetchAgents();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bind agent');
      return false;
    } finally {
      setBinding(false);
    }
  }, [nodeId, fetchAgents]);

  const unbindAgent = useCallback(async (agentId: number): Promise<boolean> => {
    setBinding(true);
    setError(null);
    try {
      // Use new unified API: unbind
      await agentBoundsApi.unbind({
        agentId,
        entityId: nodeId,
        entityType: 'NODE',
      });
      await fetchAgents();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unbind agent');
      return false;
    } finally {
      setBinding(false);
    }
  }, [nodeId, fetchAgents]);

  // Convert to AgentDTO for backward compatibility
  const agents = boundAgents.map(toAgentDTO);

  return {
    agents,
    boundAgents,
    loading,
    error,
    refresh: fetchAgents,
    bindAgent,
    unbindAgent,
    binding,
  };
}
