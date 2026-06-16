# Red Hat AI Project Space - Backstage Plugin

A Backstage plugin for showcasing and exploring AI/ML projects within your organization. Provides
an interactive showcase page with advanced filtering, search, voting capabilities, and a floating
chat interface.

## Features

- **Project Showcase** — display AI/ML projects from the Backstage catalog with rich metadata
- **Advanced Filtering** — filter by category, use case, status, domain, maturity level, tags
- **Search** — real-time search across project names, descriptions, and metadata
- **Voting System** — upvote/downvote projects with persistent vote tracking
- **Floating Chat** — interactive chat interface for project assistance
- **Responsive Design** — desktop and mobile support

## Architecture

The plugin consists of two packages:

| Package                                    | Description                              |
| ------------------------------------------ | ---------------------------------------- |
| `plugins/redhat-ai-project-space`          | React frontend (showcase page, filters)  |
| `plugins/redhat-ai-project-space-backend`  | REST API (voting, database persistence)  |

## Prerequisites

- Node.js 22+ and Yarn
- A running Backstage instance (v1.x)
- PostgreSQL or SQLite database (for vote persistence)

## Development Setup

```sh
# Install dependencies
yarn install

# Start the dev server
yarn start

# Run tests
yarn test

# Run all tests with coverage
yarn test:all

# E2E tests
yarn test:e2e

# Type checking
yarn tsc

# Lint (changed files since origin/main)
yarn lint

# Lint all files
yarn lint:all

# Format check
yarn prettier:check
```

## Deploying to RHDH

Register the backend plugin in `packages/backend/src/index.ts`:

```typescript
backend.add(import('backstage-plugin-redhat-ai-project-space-backend'));
```

Import the frontend component in `packages/app/src/App.tsx`:

```typescript
import { AIShowcasePageComponent } from 'backstage-plugin-redhat-ai-project-space';
```

## CI/CD

- `test.yml` — GitHub Actions workflow for testing on pull requests

## License

No license file is included in this repository.
