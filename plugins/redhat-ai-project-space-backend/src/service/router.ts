import express from 'express';
import Router from 'express-promise-router';
import { z } from 'zod';
import { DatabaseHandler } from '../database/DatabaseHandler';
import { LoggerService, HttpAuthService, AuthService } from '@backstage/backend-plugin-api';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { Config } from '@backstage/config';
import fetch from 'node-fetch';

export interface RouterOptions {
  auth: AuthService;
  logger: LoggerService;
  database: DatabaseHandler;
  httpAuth: HttpAuthService;
  config: Config;
}

// Schema validation
const ProjectIdSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

const GitLabFileSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  filePath: z.string().min(1, 'File path is required'),
  ref: z.string().min(1, 'Git ref is required'),
});

const GitLabUpdateFileSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  filePath: z.string().min(1, 'File path is required'),
  branch: z.string().min(1, 'Branch is required'),
  content: z.string().min(1, 'Content is required'),
  commitMessage: z.string().min(1, 'Commit message is required'),
});

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { auth, logger, database, httpAuth, config } = options;

  const router = Router();
  router.use(express.json());

  // Health check endpoint
  router.get('/health', (_, response) => {
    logger.info('Health check called');
    response.json({ status: 'ok' });
  });

  // Fetch GitLab file using backend token
  router.post('/gitlab/file', async (request, response) => {
    try {
      // Validate user credentials (required by Backstage auth)
      await httpAuth.credentials(request);

      const { projectId, filePath, ref } = GitLabFileSchema.parse(request.body);

      // Get GitLab token from config
      const gitlabConfigs = config.getOptionalConfigArray('integrations.gitlab');
      let gitlabToken: string | undefined;
      let gitlabHost = 'gitlab.com';

      if (gitlabConfigs && gitlabConfigs.length > 0) {
        const gitlabConfig = gitlabConfigs[0];
        gitlabToken = gitlabConfig.getOptionalString('token');
        gitlabHost = gitlabConfig.getOptionalString('host') || 'gitlab.com';
      }

      if (!gitlabToken) {
        logger.error('GitLab token not configured');
        response.status(500).json({
          error: 'GitLab integration not configured',
        });
        return;
      }

      const encodedFilePath = encodeURIComponent(filePath);
      const url = `https://${gitlabHost}/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodedFilePath}/raw?ref=${encodeURIComponent(ref)}`;

      logger.info(`Fetching GitLab file: ${url}`);

      const gitlabResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
        },
      });

      if (!gitlabResponse.ok) {
        logger.error(`GitLab API error: ${gitlabResponse.status} ${gitlabResponse.statusText}`);
        response.status(gitlabResponse.status).json({
          error: `Failed to fetch file from GitLab: ${gitlabResponse.status} ${gitlabResponse.statusText}`,
        });
        return;
      }

      const content = await gitlabResponse.text();
      response.json({ content });
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({
          error: 'Invalid request',
          details: error.errors,
        });
      } else {
        logger.error(`Error fetching GitLab file: ${error}`);
        response.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  });

  // Update GitLab file using backend token
  router.put('/gitlab/file', async (request, response) => {
    try {
      // Validate user credentials (required by Backstage auth)
      await httpAuth.credentials(request);

      const { projectId, filePath, branch, content, commitMessage } = GitLabUpdateFileSchema.parse(request.body);

      // Get GitLab token from config
      const gitlabConfigs = config.getOptionalConfigArray('integrations.gitlab');
      let gitlabToken: string | undefined;
      let gitlabHost = 'gitlab.com';

      if (gitlabConfigs && gitlabConfigs.length > 0) {
        const gitlabConfig = gitlabConfigs[0];
        gitlabToken = gitlabConfig.getOptionalString('token');
        gitlabHost = gitlabConfig.getOptionalString('host') || 'gitlab.com';
      }

      if (!gitlabToken) {
        logger.error('GitLab token not configured');
        response.status(500).json({
          error: 'GitLab integration not configured',
        });
        return;
      }

      const encodedFilePath = encodeURIComponent(filePath);
      const url = `https://${gitlabHost}/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodedFilePath}`;

      logger.info(`Updating GitLab file: ${url}`);

      const gitlabResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'PRIVATE-TOKEN': gitlabToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch,
          content,
          commit_message: commitMessage,
        }),
      });

      if (!gitlabResponse.ok) {
        const errorBody = await gitlabResponse.text();
        logger.error(`GitLab API error: ${gitlabResponse.status} ${gitlabResponse.statusText} - ${errorBody}`);
        response.status(gitlabResponse.status).json({
          error: `Failed to update file in GitLab: ${gitlabResponse.status} ${gitlabResponse.statusText}`,
        });
        return;
      }

      const result = await gitlabResponse.json();
      response.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({
          error: 'Invalid request',
          details: error.errors,
        });
      } else {
        logger.error(`Error updating GitLab file: ${error}`);
        response.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  });

  // Get all votes - MUST come before /votes/:projectId to avoid route collision
  router.get('/votes', async (_, response) => {
    try {
      logger.info('Getting all votes');
      const votes = await database.getAllVotes();

      response.json(votes);
    } catch (error) {
      logger.error(`Error getting all votes: ${error}`);
      response.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  // Get vote ratio for a specific project
  router.get('/votes/:projectId', async (request, response) => {
    try {
      const { projectId } = ProjectIdSchema.parse({
        projectId: request.params.projectId,
      });

      // Extract user identity (optional for GET requests)
      let userRef: string | undefined;
      try {
        const credentials = await httpAuth.credentials(request);
        if (auth.isPrincipal(credentials, 'user')) {
          userRef = credentials.principal.userEntityRef;
        }
      } catch {
        // User not authenticated, continue without user context
      }

      logger.info(`Getting vote ratio for project: ${projectId}${userRef ? ` (user: ${userRef})` : ''}`);
      const voteRatio = await database.getVoteRatio(projectId, userRef);

      response.json(voteRatio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({
          error: 'Invalid request',
          details: error.errors,
        });
      } else {
        logger.error(`Error getting vote ratio: ${error}`);
        response.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  });

  // Upvote a project
  router.post('/votes/:projectId/upvote', async (request, response) => {
    try {
      const { projectId } = ProjectIdSchema.parse({
        projectId: request.params.projectId,
      });

      // Extract user identity (required for voting)
      const credentials = await httpAuth.credentials(request);
      if (auth.isPrincipal(credentials, 'user')) {
        const userRef = credentials.principal.userEntityRef;

        if (!userRef) {
          response.status(401).json({
            error: 'User authentication required',
          });
          return;
        }

        logger.info(`User ${userRef} upvoting project: ${projectId}`);
        const voteRatio = await database.upvoteProject(projectId, userRef);

        response.json(voteRatio);
      } else {
        response.status(401).json({
          error: 'User authentication required',
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({
          error: 'Invalid request',
          details: error.errors,
        });
      } else {
        logger.error(`Error upvoting project: ${error}`);
        response.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  });

  // Downvote a project
  router.post('/votes/:projectId/downvote', async (request, response) => {
    try {
      const { projectId } = ProjectIdSchema.parse({
        projectId: request.params.projectId,
      });

      // Extract user identity (required for voting)
      const credentials = await httpAuth.credentials(request);
      if (auth.isPrincipal(credentials, 'user')) {
        const userRef = credentials.principal.userEntityRef;

        if (!userRef) {
          response.status(401).json({
            error: 'User authentication required',
          });
          return;
        }

        logger.info(`User ${userRef} downvoting project: ${projectId}`);
        const voteRatio = await database.downvoteProject(projectId, userRef);

        response.json(voteRatio);
      } else {
        response.status(401).json({
          error: 'User authentication required',
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({
          error: 'Invalid request',
          details: error.errors,
        });
      } else {
        logger.error(`Error downvoting project: ${error}`);
        response.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  });

  // Reset votes for a project (useful for testing/admin purposes)
  router.delete('/votes/:projectId', async (request, response) => {
    try {
      const { projectId } = ProjectIdSchema.parse({
        projectId: request.params.projectId,
      });

      logger.info(`Resetting votes for project: ${projectId}`);
      await database.resetVotes(projectId);

      response.json({
        message: 'Votes reset successfully',
        projectId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        response.status(400).json({
          error: 'Invalid request',
          details: error.errors,
        });
      } else {
        logger.error(`Error resetting votes: ${error}`);
        response.status(500).json({
          error: 'Internal server error',
        });
      }
    }
  });

  const errorMiddleware = MiddlewareFactory.create({
    config: options.config,
    logger: logger,
  });
  router.use(errorMiddleware.error());
  return router;
}

