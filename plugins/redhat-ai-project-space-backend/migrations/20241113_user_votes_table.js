/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('user_votes', table => {
    table.comment('Stores individual user votes for AI projects');
    table
      .string('user_ref')
      .notNullable()
      .comment('User reference/identifier from Backstage auth');
    table
      .string('project_id')
      .notNullable()
      .comment('Unique identifier for the project');
    table
      .enum('vote_type', ['upvote', 'downvote'])
      .notNullable()
      .comment('Type of vote: upvote or downvote');
    table
      .timestamp('created_at')
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Timestamp when the vote was created');
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Timestamp when the vote was last updated');
    
    // Composite primary key ensures one vote per user per project
    table.primary(['user_ref', 'project_id']);
  });

  // Create index for faster lookups by project
  await knex.schema.raw(
    'CREATE INDEX idx_user_votes_project_id ON user_votes(project_id)'
  );

  // Create index for faster lookups by user
  await knex.schema.raw(
    'CREATE INDEX idx_user_votes_user_ref ON user_votes(user_ref)'
  );
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTable('user_votes');
};

