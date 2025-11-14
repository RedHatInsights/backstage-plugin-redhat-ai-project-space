import { Knex } from 'knex';
import { resolvePackagePath } from '@backstage/backend-common';

export interface ProjectVote {
  project_id: string;
  upvotes: number;
  downvotes: number;
  created_at: Date;
  updated_at: Date;
}

export interface VoteRatio {
  projectId: string;
  upvotes: number;
  downvotes: number;
  ratio: number;
  total: number;
  userVote?: 'upvote' | 'downvote' | null;
}

export interface UserVote {
  user_ref: string;
  project_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: Date;
  updated_at: Date;
}

export class DatabaseHandler {
  constructor(private readonly db: Knex) {}

  static async create(knex: Knex): Promise<DatabaseHandler> {
    // Run migrations
    const migrationsDir = resolvePackagePath(
      'backstage-plugin-redhat-ai-project-space-backend',
      'migrations'
    );

    await knex.migrate.latest({
      directory: migrationsDir,
    });

    return new DatabaseHandler(knex);
  }

  async upvoteProject(projectId: string, userRef: string): Promise<VoteRatio> {
    // Check if user has already voted
    const existingVote = await this.db<UserVote>('user_votes')
      .where({ user_ref: userRef, project_id: projectId })
      .first();

    if (existingVote) {
      if (existingVote.vote_type === 'upvote') {
        // User already upvoted, do nothing (could also allow removing vote)
        return this.getVoteRatio(projectId, userRef);
      }
      // User previously downvoted, change to upvote
      await this.db.transaction(async trx => {
        // Update user vote
        await trx('user_votes')
          .where({ user_ref: userRef, project_id: projectId })
          .update({
            vote_type: 'upvote',
            updated_at: this.db.fn.now(),
          });

        // Update aggregate counts: add upvote, remove downvote
        await trx('project_votes')
          .where('project_id', projectId)
          .update({
            upvotes: this.db.raw('upvotes + 1'),
            downvotes: this.db.raw('downvotes - 1'),
            updated_at: this.db.fn.now(),
          });
      });
    } else {
      // New vote
      await this.db.transaction(async trx => {
        // Insert user vote
        await trx('user_votes').insert({
          user_ref: userRef,
          project_id: projectId,
          vote_type: 'upvote',
          created_at: this.db.fn.now(),
          updated_at: this.db.fn.now(),
        });

        // Update or create aggregate counts
        await trx('project_votes')
          .insert({
            project_id: projectId,
            upvotes: 1,
            downvotes: 0,
            created_at: this.db.fn.now(),
            updated_at: this.db.fn.now(),
          })
          .onConflict('project_id')
          .merge({
            upvotes: this.db.raw('project_votes.upvotes + 1'),
            updated_at: this.db.fn.now(),
          });
      });
    }

    return this.getVoteRatio(projectId, userRef);
  }

  async downvoteProject(projectId: string, userRef: string): Promise<VoteRatio> {
    // Check if user has already voted
    const existingVote = await this.db<UserVote>('user_votes')
      .where({ user_ref: userRef, project_id: projectId })
      .first();

    if (existingVote) {
      if (existingVote.vote_type === 'downvote') {
        // User already downvoted, do nothing (could also allow removing vote)
        return this.getVoteRatio(projectId, userRef);
      }
      // User previously upvoted, change to downvote
      await this.db.transaction(async trx => {
        // Update user vote
        await trx('user_votes')
          .where({ user_ref: userRef, project_id: projectId })
          .update({
            vote_type: 'downvote',
            updated_at: this.db.fn.now(),
          });

        // Update aggregate counts: add downvote, remove upvote
        await trx('project_votes')
          .where('project_id', projectId)
          .update({
            upvotes: this.db.raw('upvotes - 1'),
            downvotes: this.db.raw('downvotes + 1'),
            updated_at: this.db.fn.now(),
          });
      });
    } else {
      // New vote
      await this.db.transaction(async trx => {
        // Insert user vote
        await trx('user_votes').insert({
          user_ref: userRef,
          project_id: projectId,
          vote_type: 'downvote',
          created_at: this.db.fn.now(),
          updated_at: this.db.fn.now(),
        });

        // Update or create aggregate counts
        await trx('project_votes')
          .insert({
            project_id: projectId,
            upvotes: 0,
            downvotes: 1,
            created_at: this.db.fn.now(),
            updated_at: this.db.fn.now(),
          })
          .onConflict('project_id')
          .merge({
            downvotes: this.db.raw('project_votes.downvotes + 1'),
            updated_at: this.db.fn.now(),
          });
      });
    }

    return this.getVoteRatio(projectId, userRef);
  }

  async getVoteRatio(projectId: string, userRef?: string): Promise<VoteRatio> {
    const result = await this.db<ProjectVote>('project_votes')
      .where('project_id', projectId)
      .first();

    let userVote: 'upvote' | 'downvote' | null = null;
    if (userRef) {
      const vote = await this.db<UserVote>('user_votes')
        .where({ user_ref: userRef, project_id: projectId })
        .first();
      userVote = vote ? vote.vote_type : null;
    }

    if (!result) {
      return {
        projectId,
        upvotes: 0,
        downvotes: 0,
        ratio: 0,
        total: 0,
        userVote,
      };
    }

    const total = result.upvotes + result.downvotes;
    const ratio = total > 0 ? result.upvotes / total : 0;

    return {
      projectId,
      upvotes: result.upvotes,
      downvotes: result.downvotes,
      ratio,
      total,
      userVote,
    };
  }

  async getAllVotes(): Promise<VoteRatio[]> {
    const results = await this.db<ProjectVote>('project_votes')
      .select('*')
      .orderBy('updated_at', 'desc');

    return results.map(result => {
      const total = result.upvotes + result.downvotes;
      const ratio = total > 0 ? result.upvotes / total : 0;

      return {
        projectId: result.project_id,
        upvotes: result.upvotes,
        downvotes: result.downvotes,
        ratio,
        total,
      };
    });
  }

  async resetVotes(projectId: string): Promise<void> {
    await this.db('project_votes')
      .where('project_id', projectId)
      .delete();
  }
}

