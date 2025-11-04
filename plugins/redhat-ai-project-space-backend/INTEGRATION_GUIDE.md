# Frontend Integration Guide

This guide shows how to integrate the backend voting API with your frontend plugin.

## 1. Create API Client

Create a new file: `plugins/redhat-ai-project-space/src/api/ProjectVotesApi.ts`

```typescript
import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

export interface VoteRatio {
  projectId: string;
  upvotes: number;
  downvotes: number;
  ratio: number;
  total: number;
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
    const baseUrl = await this.discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
    const response = await this.fetchApi.fetch(`${baseUrl}/votes`);
    
    if (!response.ok) {
      throw new Error(`Failed to get all votes: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

## 2. Register API in Plugin

Update `plugins/redhat-ai-project-space/src/plugin.ts`:

```typescript
import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { projectVotesApiRef, ProjectVotesClient } from './api/ProjectVotesApi';

export const redhatAiProjectSpacePlugin = createPlugin({
  id: 'redhat-ai-project-space',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: projectVotesApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new ProjectVotesClient(discoveryApi, fetchApi),
    }),
  ],
});

// ... rest of your plugin exports
```

## 3. Create Vote Button Component

Create `plugins/redhat-ai-project-space/src/components/VoteButtons/VoteButtons.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useApi } from '@backstage/core-plugin-api';
import { projectVotesApiRef, VoteRatio } from '../../api/ProjectVotesApi';
import {
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
} from '@material-ui/core';
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';

interface VoteButtonsProps {
  projectId: string;
}

export const VoteButtons = ({ projectId }: VoteButtonsProps) => {
  const votesApi = useApi(projectVotesApiRef);
  const [votes, setVotes] = useState<VoteRatio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVotes();
  }, [projectId]);

  const loadVotes = async () => {
    try {
      setLoading(true);
      const ratio = await votesApi.getVoteRatio(projectId);
      setVotes(ratio);
      setError(null);
    } catch (err) {
      setError('Failed to load votes');
      console.error('Error loading votes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      setLoading(true);
      const ratio = await votesApi.upvote(projectId);
      setVotes(ratio);
      setError(null);
    } catch (err) {
      setError('Failed to upvote');
      console.error('Error upvoting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownvote = async () => {
    try {
      setLoading(true);
      const ratio = await votesApi.downvote(projectId);
      setVotes(ratio);
      setError(null);
    } catch (err) {
      setError('Failed to downvote');
      console.error('Error downvoting:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !votes) {
    return <CircularProgress size={20} />;
  }

  const percentage = votes ? Math.round(votes.ratio * 100) : 0;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title="Upvote">
        <IconButton
          size="small"
          onClick={handleUpvote}
          disabled={loading}
          color={votes && votes.upvotes > 0 ? 'primary' : 'default'}
        >
          <ThumbUpIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Typography variant="body2" color="textSecondary">
        {votes ? `${votes.upvotes}` : '0'}
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        |
      </Typography>
      
      <Typography variant="body2" color="textSecondary">
        {votes ? `${votes.downvotes}` : '0'}
      </Typography>
      
      <Tooltip title="Downvote">
        <IconButton
          size="small"
          onClick={handleDownvote}
          disabled={loading}
          color={votes && votes.downvotes > 0 ? 'secondary' : 'default'}
        >
          <ThumbDownIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      {votes && votes.total > 0 && (
        <Typography variant="caption" color="textSecondary">
          ({percentage}% positive)
        </Typography>
      )}
      
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
};
```

## 4. Use Vote Buttons in Project Card

Update `plugins/redhat-ai-project-space/src/components/AIShowcasePage/ProjectCard.tsx`:

```typescript
import { VoteButtons } from '../VoteButtons/VoteButtons';

// ... inside your ProjectCard component

<CardActions>
  {/* Your existing actions */}
  <VoteButtons projectId={project.id} />
</CardActions>
```

## 5. Display Vote Rankings

Create a hook to fetch and sort projects by votes:

`plugins/redhat-ai-project-space/src/hooks/useProjectVotes.ts`:

```typescript
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
        const allVotes = await votesApi.getAllVotes();
        const votesMap = new Map(
          allVotes.map(vote => [vote.projectId, vote])
        );
        setVotes(votesMap);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadVotes();
  }, [votesApi]);

  return { votes, loading, error };
};
```

Use it in your projects list:

```typescript
import { useProjectVotes } from '../../hooks/useProjectVotes';

export const ProjectsList = () => {
  const { votes, loading: votesLoading } = useProjectVotes();
  const projects = // ... your projects data
  
  // Sort projects by vote ratio
  const sortedProjects = [...projects].sort((a, b) => {
    const voteA = votes.get(a.id);
    const voteB = votes.get(b.id);
    
    if (!voteA && !voteB) return 0;
    if (!voteA) return 1;
    if (!voteB) return -1;
    
    return voteB.ratio - voteA.ratio;
  });
  
  // ... render projects
};
```

## 6. Add to Package Dependencies

Update `plugins/redhat-ai-project-space/package.json`:

```json
{
  "dependencies": {
    "@backstage/core-plugin-api": "^1.10.3",
    "@material-ui/icons": "^4.9.1"
    // ... other dependencies
  }
}
```

## 7. Testing the Integration

### Start Both Services

```bash
# Terminal 1 - Backend
yarn start-backend

# Terminal 2 - Frontend
yarn start
```

### Verify API Connection

1. Open browser DevTools (Network tab)
2. Navigate to your AI Project Space page
3. You should see API calls to `/api/redhat-ai-project-space-backend/votes`
4. Click upvote/downvote buttons
5. Verify POST requests succeed and UI updates

### Test Scenarios

1. **Vote on a project** - Should increment count immediately
2. **Reload page** - Votes should persist
3. **Vote from different browser** - Should see vote counts
4. **Network error handling** - Disable network, verify error messages
5. **Multiple rapid clicks** - Should handle gracefully

## 8. Advanced Features

### Add Vote History

Track individual user votes (requires authentication):

```typescript
// Store user votes in localStorage
const getUserVoteKey = (projectId: string) => `vote_${projectId}`;

const hasUserVoted = (projectId: string): 'up' | 'down' | null => {
  return localStorage.getItem(getUserVoteKey(projectId)) as 'up' | 'down' | null;
};

const setUserVote = (projectId: string, vote: 'up' | 'down' | null) => {
  if (vote) {
    localStorage.setItem(getUserVoteKey(projectId), vote);
  } else {
    localStorage.removeItem(getUserVoteKey(projectId));
  }
};
```

### Add Vote Analytics

Display trending projects:

```typescript
export const TrendingProjects = () => {
  const { votes } = useProjectVotes();
  
  const trending = Array.from(votes.values())
    .filter(v => v.total >= 5) // Minimum votes threshold
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 10);
    
  return (
    <List>
      {trending.map(vote => (
        <ListItem key={vote.projectId}>
          <ListItemText 
            primary={vote.projectId}
            secondary={`${Math.round(vote.ratio * 100)}% positive (${vote.total} votes)`}
          />
        </ListItem>
      ))}
    </List>
  );
};
```

## Troubleshooting

### CORS Issues

If you get CORS errors, verify `app-config.yaml`:

```yaml
backend:
  cors:
    origin: http://localhost:3000
    methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
    credentials: true
```

### API Not Found

Check that:
1. Backend is running on port 7007
2. Plugin is registered in `packages/backend/src/index.ts`
3. Discovery API can resolve `redhat-ai-project-space-backend`

### Type Errors

Ensure TypeScript can find the API types:
```bash
yarn tsc --noEmit
```

## Next Steps

1. Add authentication/authorization
2. Implement rate limiting
3. Add vote change notifications
4. Create admin dashboard for vote management
5. Add analytics and reporting
6. Implement vote reasons/comments

