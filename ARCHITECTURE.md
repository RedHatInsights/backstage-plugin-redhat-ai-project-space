# Architecture

## Overview

A Backstage monorepo containing the Red Hat AI Project Space plugin with separate frontend and
backend packages. Built with the Backstage CLI using Yarn workspaces.

## Module Structure

```text
plugins/
  redhat-ai-project-space/          # Frontend plugin (React components)
  redhat-ai-project-space-backend/  # Backend plugin (REST API, database)
packages/
  app/                              # Backstage app shell for local dev
  backend/                          # Backstage backend for local dev
examples/                           # Example catalog entities
catalog_default/                    # Default catalog configuration
playwright.config.ts                # E2E test configuration
```

## Key Design Decisions

- **Frontend/backend split.** The voting system requires server-side state (database persistence),
  so the plugin is split into a frontend (React UI) and backend (Express REST API) package.
- **Database-backed voting.** Votes are persisted to PostgreSQL or SQLite via the Backstage
  database service, enabling persistent tracking across sessions.
- **Catalog-driven content.** Projects are sourced from the Backstage catalog using custom
  annotations rather than a separate data store, keeping the plugin's data model aligned with the
  existing Backstage entity system.
- **Dynamic plugin support.** The plugin can be packaged as a dynamic plugin tarball for RHDH
  deployment without rebuilding the entire Backstage instance.

## Dependencies

- **Backstage CLI** (`@backstage/cli` ^0.35.2) — build tooling
- **Playwright** — E2E testing
- **ESLint + Prettier** — linting and formatting
