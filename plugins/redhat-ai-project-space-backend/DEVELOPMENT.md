# Development Guide

## Backend Plugin Structure

This backend plugin follows the new Backstage backend system architecture and is configured to work as a dynamic plugin for Red Hat Developer Hub.

## Project Structure

```
redhat-ai-project-space-backend/
├── src/
│   ├── database/
│   │   └── DatabaseHandler.ts      # Database operations with Knex
│   ├── service/
│   │   └── router.ts               # Express router with API endpoints
│   ├── dynamic/
│   │   └── index.ts                # Dynamic plugin entry point
│   ├── plugin.ts                   # Plugin definition
│   └── index.ts                    # Main entry point
├── migrations/
│   └── 20241104_initial_votes_table.js  # Database migration
├── package.json
├── tsconfig.json
└── README.md
```

## Development Setup

### Prerequisites

- Node.js >= 20.17.0
- Yarn >= 1.22.22

### Install Dependencies

From the repository root:

```bash
yarn install
```

### Build the Plugin

```bash
cd plugins/redhat-ai-project-space-backend
yarn build
```

### Run Tests

```bash
yarn test
```

### Start Development Backend

From the repository root:

```bash
yarn start-backend
```

The plugin will be available at: `http://localhost:7007/api/redhat-ai-project-space-backend`

## Database

### Development Database

The development setup uses in-memory SQLite configured in `app-config.yaml`:

```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
```

### Migrations

Migrations are automatically run when the plugin initializes. The database handler uses Knex migrations located in the `migrations/` directory.

To add a new migration, create a file following the pattern: `YYYYMMDD_description.js`

## API Testing

### Using curl

```bash
# Health check
curl http://localhost:7007/api/redhat-ai-project-space-backend/health

# Get vote ratio for a project
curl http://localhost:7007/api/redhat-ai-project-space-backend/votes/project-123

# Upvote a project
curl -X POST http://localhost:7007/api/redhat-ai-project-space-backend/votes/project-123/upvote

# Downvote a project
curl -X POST http://localhost:7007/api/redhat-ai-project-space-backend/votes/project-123/downvote

# Get all votes
curl http://localhost:7007/api/redhat-ai-project-space-backend/votes
```

## Building for Red Hat Developer Hub

### Build Dynamic Plugin

```bash
yarn export-dynamic
```

This creates a `dist-dynamic/` directory with the packaged plugin ready for deployment.

### Create Tarball

From the repository root:

```bash
make build-backend-plugin
```

This will create a tarball in `build/redhat-ai-project-space-backend/`

### Package Contents

The dynamic plugin package includes:
- Compiled JavaScript (CommonJS)
- TypeScript declarations
- Database migrations
- Package metadata
- Config schema

## Configuration

### Plugin Configuration

The plugin uses standard Backstage database configuration. No additional configuration is required for basic operation.

### Database Connection Pooling (Production)

For production use with PostgreSQL, configure connection pooling in your `app-config.production.yaml`:

```yaml
backend:
  database:
    client: pg
    connection:
      host: ${POSTGRES_HOST}
      port: ${POSTGRES_PORT}
      user: ${POSTGRES_USER}
      password: ${POSTGRES_PASSWORD}
      database: ${POSTGRES_DATABASE}
    pool:
      min: 2
      max: 10
```

## Troubleshooting

### Build Issues

If you encounter build errors about missing declaration files:

```bash
# Generate TypeScript declarations
yarn tsc

# Copy to expected location (from root)
mkdir -p dist-types/plugins/redhat-ai-project-space-backend/src
cp -r plugins/redhat-ai-project-space-backend/dist-types/* dist-types/plugins/redhat-ai-project-space-backend/src/

# Build again
yarn build
```

### Database Issues

If migrations fail or tables don't exist:

1. Check that the database connection is configured correctly
2. Verify migrations directory is included in the build
3. Check backend logs for migration errors

### Plugin Not Loading

If the plugin doesn't load in the backend:

1. Verify it's added to `packages/backend/src/index.ts`
2. Check that the package is linked in `packages/backend/package.json`
3. Run `yarn install` from the root
4. Restart the backend

## Code Style

The plugin follows the standard Backstage code style. Run linting with:

```bash
yarn lint
```

## Contributing

When making changes:

1. Write tests for new functionality
2. Update documentation
3. Run tests and linting
4. Build the plugin to ensure it compiles
5. Test the dynamic plugin export

## Architecture Notes

### New Backend System

This plugin uses the new Backstage backend system with `createBackendPlugin`. Key features:

- Dependency injection via `deps`
- Automatic database client provisioning
- HTTP router registration
- Service-to-service authentication support

### Database Abstraction

The `DatabaseHandler` class provides a clean abstraction over Knex operations:

- Automatic migration management
- Upsert logic for votes
- Type-safe database operations
- PostgreSQL and SQLite compatibility

### REST API Design

The router follows REST principles:

- Proper HTTP methods (GET, POST, DELETE)
- Consistent response formats
- Input validation with Zod
- Error handling with appropriate status codes

