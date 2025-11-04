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

  async upvoteProject(projectId: string): Promise<VoteRatio> {
    await this.db('project_votes')
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

    return this.getVoteRatio(projectId);
  }

  async downvoteProject(projectId: string): Promise<VoteRatio> {
    await this.db('project_votes')
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

    return this.getVoteRatio(projectId);
  }

  async getVoteRatio(projectId: string): Promise<VoteRatio> {
    const result = await this.db<ProjectVote>('project_votes')
      .where('project_id', projectId)
      .first();

    if (!result) {
      return {
        projectId,
        upvotes: 0,
        downvotes: 0,
        ratio: 0,
        total: 0,
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

