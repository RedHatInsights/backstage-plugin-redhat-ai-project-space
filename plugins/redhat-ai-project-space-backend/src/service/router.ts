import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { z } from 'zod';
import { DatabaseHandler } from '../database/DatabaseHandler';
import { LoggerService, HttpAuthService } from '@backstage/backend-plugin-api';

export interface RouterOptions {
  logger: LoggerService;
  database: DatabaseHandler;
  httpAuth: HttpAuthService;
}

// Schema validation
const ProjectIdSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, database, httpAuth } = options;

  const router = Router();
  router.use(express.json());

  // Health check endpoint
  router.get('/health', (_, response) => {
    logger.info('Health check called');
    response.json({ status: 'ok' });
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
        userRef = credentials.principal.userEntityRef;
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

  router.use(errorHandler());
  return router;
}

