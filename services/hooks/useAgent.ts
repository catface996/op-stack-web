/**
 * useAgent Hook
 *
 * Fetch and manage a single agent by ID
 * Feature: 013-agent-config-page
 */

import { useState, useEffect, useCallback } from 'react';
import { getAgent, updateAgent } from '../api/agents';
import type { UpdateAgentRequest } from '../api/types';
import { toFrontendAgent, AgentWithApiFields } from './useAgents';

interface UseAgentOptions {
  id: number;
}

interface UseAgentResult {
  agent: AgentWithApiFields | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  handleUpdate: (updates: Partial<UpdateAgentRequest>) => Promise<boolean>;
  updating: boolean;
}

export function useAgent({ id }: UseAgentOptions): UseAgentResult {
  const [agent, setAgent] = useState<AgentWithApiFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchAgent = useCallback(async () => {
    if (!id || isNaN(id)) {
      setError('Invalid agent ID');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[useAgent] Fetching agent with ID:', id);
      const response = await getAgent({ id });
      console.log('[useAgent] Response:', response);

      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess && response.data) {
        const convertedAgent = toFrontendAgent(response.data);
        setAgent(convertedAgent);
      } else {
        setError(response.message || 'Failed to load agent');
        setAgent(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load agent';
      setError(message);
      setAgent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  const refresh = useCallback(() => {
    fetchAgent();
  }, [fetchAgent]);

  const handleUpdate = useCallback(async (
    updates: Partial<UpdateAgentRequest>
  ): Promise<boolean> => {
    if (!agent) return false;

    setUpdating(true);
    setError(null);

    try {
      const request: UpdateAgentRequest = {
        id: Number(agent.id),
        ...updates,
      };

      console.log('[useAgent] Updating agent:', request);
      const response = await updateAgent(request);
      console.log('[useAgent] Update response:', response);

      const isSuccess = response.code === 0 || response.success === true;
      if (isSuccess) {
        // If backend returns updated agent data, use it
        if (response.data) {
          const updatedAgent = toFrontendAgent(response.data);
          setAgent(updatedAgent);
        } else {
          // Otherwise refresh agent data from server
          await fetchAgent();
        }
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
  }, [agent, fetchAgent]);

  return {
    agent,
    loading,
    error,
    refresh,
    handleUpdate,
    updating,
  };
}
