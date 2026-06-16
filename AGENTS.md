# Red Hat AI Project Space

## Project Overview

A Backstage plugin for showcasing AI/ML projects with filtering, search, voting, and chat features.
Consists of a React frontend and Express backend with database-backed vote persistence. Built for
Red Hat Developer Hub (RHDH) deployment.

## Dependencies

- **Runtime:** Node.js 22+, Backstage CLI ^0.35.2, React, TypeScript
- **Test:** Jest, Playwright (E2E)
- **Lint:** ESLint, Prettier
- **CI:** GitHub Actions (test.yml)

## Development Commands

```sh
yarn install       # Install dependencies
yarn start         # Start dev server
yarn test          # Run unit tests
yarn test:all      # All tests with coverage
yarn test:e2e      # E2E tests (Playwright)
yarn tsc           # Type checking
yarn lint          # Lint changed files
yarn lint:all      # Lint all files
yarn prettier:check  # Format check
```

See [Development Setup][readme-dev] in the README for full setup instructions.

## Architecture

Backstage monorepo with frontend (`plugins/redhat-ai-project-space`) and backend
(`plugins/redhat-ai-project-space-backend`) packages. Backend provides REST API with database
persistence for voting. See [ARCHITECTURE.md][architecture] for design decisions.

## Code Style

- **Linter:** ESLint (Backstage preset)
- **Formatter:** Prettier
- **Language:** TypeScript (strict, via `tsconfig.json`)
- **Node.js:** 22+ required

## Common Mistakes

1. **Forgetting the backend plugin registration.** The backend must be registered in
   `packages/backend/src/index.ts`. Without it, the voting API returns 404 errors while the
   frontend appears to work.

2. **Running `yarn lint` expecting full coverage.** The default `lint` command only checks files
   changed since `origin/main`. Use `yarn lint:all` for complete coverage.

3. **Missing database configuration.** The voting backend requires a database (PostgreSQL or
   SQLite). Without database configuration in `app-config.yaml`, the backend plugin will fail
   to start with a connection error.

## Testing

```sh
yarn test          # Unit tests (Jest)
yarn test:all      # All tests with coverage
yarn test:e2e      # E2E tests (Playwright)
```

[readme-dev]: ./README.md#development-setup
[architecture]: ./ARCHITECTURE.md
