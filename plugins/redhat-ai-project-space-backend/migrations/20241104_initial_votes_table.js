/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('project_votes', table => {
    table.comment('Stores upvotes and downvotes for AI projects');
    table
      .string('project_id')
      .primary()
      .notNullable()
      .comment('Unique identifier for the project');
    table
      .integer('upvotes')
      .notNullable()
      .defaultTo(0)
      .comment('Number of upvotes');
    table
      .integer('downvotes')
      .notNullable()
      .defaultTo(0)
      .comment('Number of downvotes');
    table
      .timestamp('created_at')
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Timestamp when the record was created');
    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.fn.now())
      .comment('Timestamp when the record was last updated');
  });

  // Create index for faster lookups
  await knex.schema.raw(
    'CREATE INDEX idx_project_votes_updated_at ON project_votes(updated_at DESC)'
  );
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTable('project_votes');
};

