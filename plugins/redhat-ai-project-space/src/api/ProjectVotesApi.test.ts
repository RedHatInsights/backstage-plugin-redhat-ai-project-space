import { ProjectVotesClient, projectVotesApiRef } from './ProjectVotesApi';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

describe('ProjectVotesApi', () => {
  let mockDiscoveryApi: jest.Mocked<DiscoveryApi>;
  let mockFetchApi: jest.Mocked<FetchApi>;
  let client: ProjectVotesClient;

  beforeEach(() => {
    mockDiscoveryApi = {
      getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api/redhat-ai-project-space-backend'),
    } as any;

    mockFetchApi = {
      fetch: jest.fn(),
    } as any;

    client = new ProjectVotesClient(mockDiscoveryApi, mockFetchApi);
  });

  describe('projectVotesApiRef', () => {
    it('should be defined', () => {
      expect(projectVotesApiRef).toBeDefined();
    });

    it('should have correct id', () => {
      expect(projectVotesApiRef.id).toBe('plugin.redhat-ai-project-space.votes');
    });
  });

  describe('ProjectVotesClient', () => {
    it('should create an instance', () => {
      expect(client).toBeInstanceOf(ProjectVotesClient);
    });

    describe('upvote', () => {
      it('should call the upvote endpoint', async () => {
        const mockResponse = {
          projectId: 'test-project',
          upvotes: 1,
          downvotes: 0,
          ratio: 1,
          total: 1,
        };

        mockFetchApi.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        } as any);

        const result = await client.upvote('test-project');

        expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('redhat-ai-project-space-backend');
        expect(mockFetchApi.fetch).toHaveBeenCalledWith(
          'http://localhost:7007/api/redhat-ai-project-space-backend/votes/test-project/upvote',
          { method: 'POST' }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should throw error on failed response', async () => {
        mockFetchApi.fetch.mockResolvedValue({
          ok: false,
          statusText: 'Not Found',
        } as any);

        await expect(client.upvote('test-project')).rejects.toThrow('Failed to upvote: Not Found');
      });
    });

    describe('downvote', () => {
      it('should call the downvote endpoint', async () => {
        const mockResponse = {
          projectId: 'test-project',
          upvotes: 0,
          downvotes: 1,
          ratio: 0,
          total: 1,
        };

        mockFetchApi.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        } as any);

        const result = await client.downvote('test-project');

        expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('redhat-ai-project-space-backend');
        expect(mockFetchApi.fetch).toHaveBeenCalledWith(
          'http://localhost:7007/api/redhat-ai-project-space-backend/votes/test-project/downvote',
          { method: 'POST' }
        );
        expect(result).toEqual(mockResponse);
      });

      it('should throw error on failed response', async () => {
        mockFetchApi.fetch.mockResolvedValue({
          ok: false,
          statusText: 'Internal Server Error',
        } as any);

        await expect(client.downvote('test-project')).rejects.toThrow('Failed to downvote: Internal Server Error');
      });
    });

    describe('getVoteRatio', () => {
      it('should fetch vote ratio for a project', async () => {
        const mockResponse = {
          projectId: 'test-project',
          upvotes: 5,
          downvotes: 2,
          ratio: 0.71,
          total: 7,
        };

        mockFetchApi.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        } as any);

        const result = await client.getVoteRatio('test-project');

        expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('redhat-ai-project-space-backend');
        expect(mockFetchApi.fetch).toHaveBeenCalledWith(
          'http://localhost:7007/api/redhat-ai-project-space-backend/votes/test-project'
        );
        expect(result).toEqual(mockResponse);
      });

      it('should throw error on failed response', async () => {
        mockFetchApi.fetch.mockResolvedValue({
          ok: false,
          statusText: 'Bad Request',
        } as any);

        await expect(client.getVoteRatio('test-project')).rejects.toThrow('Failed to get vote ratio: Bad Request');
      });
    });

    describe('getAllVotes', () => {
      it('should fetch all votes', async () => {
        const mockResponse = [
          {
            projectId: 'project-1',
            upvotes: 5,
            downvotes: 2,
            ratio: 0.71,
            total: 7,
          },
          {
            projectId: 'project-2',
            upvotes: 3,
            downvotes: 1,
            ratio: 0.75,
            total: 4,
          },
        ];

        mockFetchApi.fetch.mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        } as any);

        const result = await client.getAllVotes();

        expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('redhat-ai-project-space-backend');
        expect(mockFetchApi.fetch).toHaveBeenCalledWith(
          'http://localhost:7007/api/redhat-ai-project-space-backend/votes'
        );
        expect(result).toEqual(mockResponse);
      });

      it('should throw error on failed response', async () => {
        mockFetchApi.fetch.mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        } as any);

        await expect(client.getAllVotes()).rejects.toThrow('Failed to get all votes: 500 Internal Server Error');
      });
    });
  });
});
