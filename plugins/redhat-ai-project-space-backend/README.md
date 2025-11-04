# Red Hat AI Project Space Backend Plugin

Backend plugin for the Red Hat AI Project Space that provides persistence for project upvotes and downvotes.

## Features

- **Vote Persistence**: Store and retrieve upvotes/downvotes for AI projects
- **Database Support**: SQLite for development, PostgreSQL for production
- **RESTful API**: Clean REST endpoints for vote operations
- **Dynamic Plugin**: Supports Red Hat Developer Hub dynamic plugin architecture

## Installation

### Development (Monorepo)

The plugin is automatically wired up in the development backend. Start the backend with:

```bash
yarn start-backend
```

### Production (Dynamic Plugin)

Build the dynamic plugin:

```bash
cd plugins/redhat-ai-project-space-backend
yarn export-dynamic
```

## API Endpoints

All endpoints are prefixed with `/api/redhat-ai-project-space-backend`

### Get Vote Ratio for a Project

```
GET /votes/:projectId
```

Returns the vote statistics for a specific project.

**Response:**
```json
{
  "projectId": "project-123",
  "upvotes": 10,
  "downvotes": 2,
  "ratio": 0.833,
  "total": 12
}
```

### Get All Votes

```
GET /votes
```

Returns vote statistics for all projects, ordered by most recently updated.

**Response:**
```json
[
  {
    "projectId": "project-123",
    "upvotes": 10,
    "downvotes": 2,
    "ratio": 0.833,
    "total": 12
  },
  {
    "projectId": "project-456",
    "upvotes": 5,
    "downvotes": 1,
    "ratio": 0.833,
    "total": 6
  }
]
```

### Upvote a Project

```
POST /votes/:projectId/upvote
```

Increments the upvote count for the specified project. Creates a new record if the project doesn't exist.

**Response:**
```json
{
  "projectId": "project-123",
  "upvotes": 11,
  "downvotes": 2,
  "ratio": 0.846,
  "total": 13
}
```

### Downvote a Project

```
POST /votes/:projectId/downvote
```

Increments the downvote count for the specified project. Creates a new record if the project doesn't exist.

**Response:**
```json
{
  "projectId": "project-123",
  "upvotes": 11,
  "downvotes": 3,
  "ratio": 0.786,
  "total": 14
}
```

### Reset Votes (Admin)

```
DELETE /votes/:projectId
```

Deletes all vote data for the specified project.

**Response:**
```json
{
  "message": "Votes reset successfully",
  "projectId": "project-123"
}
```

### Health Check

```
GET /health
```

Returns the health status of the plugin.

**Response:**
```json
{
  "status": "ok"
}
```

## Database Schema

### `project_votes` Table

| Column | Type | Description |
|--------|------|-------------|
| project_id | string (PK) | Unique identifier for the project |
| upvotes | integer | Number of upvotes (default: 0) |
| downvotes | integer | Number of downvotes (default: 0) |
| created_at | timestamp | When the record was created |
| updated_at | timestamp | When the record was last updated |

## Configuration

The plugin uses the standard Backstage database configuration from `app-config.yaml`:

```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
    # For production with PostgreSQL:
    # client: pg
    # connection:
    #   host: ${POSTGRES_HOST}
    #   port: ${POSTGRES_PORT}
    #   user: ${POSTGRES_USER}
    #   password: ${POSTGRES_PASSWORD}
    #   database: backstage_plugin_redhat_ai_project_space
```

## Development

### Run Tests

```bash
yarn test
```

### Linting

```bash
yarn lint
```

### Build

```bash
yarn build
```

## Architecture

The plugin follows the new Backstage backend system architecture:

- **Plugin Definition** (`plugin.ts`): Uses `createBackendPlugin` for the new backend system
- **Router** (`service/router.ts`): Express router with REST endpoints
- **Database Handler** (`database/DatabaseHandler.ts`): Knex-based database operations
- **Migrations** (`migrations/`): Database schema versioning

## License

Apache-2.0

