import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

export interface GitLabFileRequest {
  projectId: string;
  filePath: string;
  ref: string;
}

export interface GitLabFileResponse {
  content: string;
}

export interface GitLabApiClient {
  fetchFile(request: GitLabFileRequest): Promise<string>;
}

export const gitlabApiClientRef = createApiRef<GitLabApiClient>({
  id: 'plugin.redhat-ai-project-space.gitlab',
});

export class GitLabApiClientImpl implements GitLabApiClient {
  constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  async fetchFile(request: GitLabFileRequest): Promise<string> {
    const baseUrl = await this.discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
    const response = await this.fetchApi.fetch(
      `${baseUrl}/gitlab/file`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `Failed to fetch file from GitLab: ${response.status} ${response.statusText}`);
    }

    const data: GitLabFileResponse = await response.json();
    return data.content;
  }
}
