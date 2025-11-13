import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

export interface VoteRatio {
  projectId: string;
  upvotes: number;
  downvotes: number;
  ratio: number;
  total: number;
  userVote?: 'upvote' | 'downvote' | null;
}

export interface ProjectVotesApi {
  upvote(projectId: string): Promise<VoteRatio>;
  downvote(projectId: string): Promise<VoteRatio>;
  getVoteRatio(projectId: string): Promise<VoteRatio>;
  getAllVotes(): Promise<VoteRatio[]>;
}

export const projectVotesApiRef = createApiRef<ProjectVotesApi>({
  id: 'plugin.redhat-ai-project-space.votes',
});

export class ProjectVotesClient implements ProjectVotesApi {
  constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  async upvote(projectId: string): Promise<VoteRatio> {
    const baseUrl = await this.discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
    const response = await this.fetchApi.fetch(
      `${baseUrl}/votes/${encodeURIComponent(projectId)}/upvote`,
      { method: 'POST' }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to upvote: ${response.statusText}`);
    }
    
    return response.json();
  }

  async downvote(projectId: string): Promise<VoteRatio> {
    const baseUrl = await this.discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
    const response = await this.fetchApi.fetch(
      `${baseUrl}/votes/${encodeURIComponent(projectId)}/downvote`,
      { method: 'POST' }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to downvote: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getVoteRatio(projectId: string): Promise<VoteRatio> {
    const baseUrl = await this.discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
    const response = await this.fetchApi.fetch(
      `${baseUrl}/votes/${encodeURIComponent(projectId)}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get vote ratio: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getAllVotes(): Promise<VoteRatio[]> {
    try {
      const baseUrl = await this.discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
      console.log('[ProjectVotesApi] Fetching all votes from:', `${baseUrl}/votes`);
      const response = await this.fetchApi.fetch(`${baseUrl}/votes`);
      
      console.log('[ProjectVotesApi] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ProjectVotesApi] Error response:', errorText);
        throw new Error(`Failed to get all votes: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[ProjectVotesApi] Received votes data:', data);
      return data;
    } catch (error) {
      console.error('[ProjectVotesApi] Exception in getAllVotes:', error);
      throw error;
    }
  }
}

