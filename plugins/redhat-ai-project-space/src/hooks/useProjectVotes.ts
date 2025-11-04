import { useEffect, useState } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { projectVotesApiRef, VoteRatio } from '../api/ProjectVotesApi';

export const useProjectVotes = () => {
  const votesApi = useApi(projectVotesApiRef);
  const [votes, setVotes] = useState<Map<string, VoteRatio>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadVotes = async () => {
      try {
        setLoading(true);
        console.log('[useProjectVotes] Loading all votes...');
        const allVotes = await votesApi.getAllVotes();
        console.log('[useProjectVotes] Loaded votes:', allVotes);
        const votesMap = new Map(
          allVotes.map(vote => [vote.projectId, vote])
        );
        setVotes(votesMap);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('[useProjectVotes] Error loading votes:', err);
        // Set empty map on error so the component still renders
        setVotes(new Map());
      } finally {
        setLoading(false);
      }
    };

    loadVotes();
  }, [votesApi]);

  const refreshVote = async (projectId: string) => {
    try {
      const voteRatio = await votesApi.getVoteRatio(projectId);
      setVotes(prev => {
        const newVotes = new Map(prev);
        newVotes.set(projectId, voteRatio);
        return newVotes;
      });
    } catch (err) {
      console.error('Error refreshing vote:', err);
    }
  };

  return { votes, loading, error, refreshVote };
};

