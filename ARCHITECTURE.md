# Architecture

This document describes the internal design of the Red Hat AI Project Space Backstage plugin —
a frontend/backend plugin pair that provides an AI project showcase, voting system, and conversational
AI assistant within Backstage. It covers data flow, component design, database schema, the dynamic
plugin packaging model, and key design tradeoffs.

## High-Level Overview

The system consists of four workspace packages organized in a Yarn Workspaces monorepo:

```
root
├── packages/app/          # Backstage frontend shell (dev harness)
├── packages/backend/      # Backstage backend shell (dev harness)
├── plugins/redhat-ai-project-space/          # Frontend plugin (deliverable)
└── plugins/redhat-ai-project-space-backend/  # Backend plugin (deliverable)
```

The two plugin packages are the deliverables. The two `packages/` entries are development harnesses
that wire the plugins into a full Backstage instance for local development and testing. In
production, only the plugin packages are deployed — either statically bundled or as dynamic plugins
in Red Hat Developer Hub.

### Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│                                                                  │
│  ┌─────────────────────────────┐                                 │
│  │  Frontend Plugin            │                                 │
│  │  AIShowcasePage             │                                 │
│  │  ├── Catalog API ──────────────── GET /api/catalog/entities  │
│  │  ├── ProjectVotesClient ───────── GET/POST /api/redhat-ai-  │
│  │  │                                project-space-backend/votes │
│  │  └── FloatingChat ────────────── POST /api/proxy/tangerine/ │
│  │                                   api/assistants/chat         │
│  └─────────────────────────────┘                                 │
└──────────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   Backstage Catalog   Backend Plugin   Backstage Proxy
   (entity store)      (voting API)     (→ external LLM)
                          │
                          ▼
                    SQLite / PostgreSQL
```

Three distinct backend communication paths exist:

1. **Catalog API** — the frontend fetches `Component` entities from the `ai` namespace via the
   standard Backstage Catalog API. No custom backend code is involved.
2. **Voting API** — the frontend plugin's `ProjectVotesClient` communicates with the backend
   plugin's Express router for vote operations. The backend plugin owns its own database tables.
3. **Chat proxy** — the floating chat component streams responses from an external LLM service
   (codename "tangerine") via the Backstage proxy plugin. No custom backend code handles this
   traffic; it passes through `proxy-backend` as configured in `app-config.yaml`.

## Frontend Plugin Internals

### Plugin Registration

The plugin is created in `plugins/redhat-ai-project-space/src/plugin.ts` using Backstage's
`createPlugin` API with the ID `redhat-ai-project-space`. It registers a single API factory
(`projectVotesApiRef`) and provides one lazy-loaded component extension
(`AIShowcasePageComponent`).

The host application mounts this component at a route of its choice (the dev harness uses
`/ai-showcase`). The plugin does not define its own routes internally — it exposes a single
full-page component.

### Component Hierarchy

```
AIShowcasePage
├── DisclaimerAlert            # Info banner about unreviewed projects
├── Grid (3/9 column layout)
│   ├── SidebarContainer       # Left column
│   │   ├── FilterSidebar      # Sort-by, 5 dropdown filters, tag autocomplete, featured toggle
│   │   │   └── TagFilter      # MUI Autocomplete multi-select for entity tags
│   │   └── UsefulLinks        # Curated Red Hat AI resource links
│   └── Main content           # Right column
│       ├── SearchBar          # Full-text search input
│       └── ProjectsList       # Sorted, filtered project cards
│           └── ProjectCard    # Per-project card with metadata grid
│               └── VoteButtons # Upvote/downvote toggle with counts
└── FloatingChat               # Portal-rendered AI chat assistant (fixed position)
```

### State Management

The plugin uses local React state exclusively — no global state library, no Redux, no context
providers beyond what Backstage provides. State lives in three layers:

| Layer | Mechanism | Scope |
|-------|-----------|-------|
| Entity data | `useState` in `AIShowcasePage` | Fetched once on mount via Catalog API |
| Filter/search state | `useState` in `AIShowcasePage` | Derived filter options computed via `useMemo` |
| Vote data | `useProjectVotes` custom hook | `Map<string, VoteRatio>` loaded on mount, updated per-project via `refreshVote` |
| Chat state | `useState` in `FloatingChat` | Conversation array, session ID, streaming state |

Filter options (available categories, usecases, statuses, etc.) are derived at runtime from the
fetched entity set using `useMemo`, not hardcoded. This means the filter dropdowns automatically
reflect whatever annotation values exist in the catalog.

### API Client

`ProjectVotesClient` (`plugins/redhat-ai-project-space/src/api/ProjectVotesApi.ts`) uses
Backstage's `DiscoveryApi` to resolve the backend plugin's base URL at runtime, then makes REST
calls using Backstage's `FetchApi`. This approach ensures the client works in both static and
dynamic plugin deployments without hardcoding URLs. Project IDs are URI-encoded in path segments.

### Floating Chat Architecture

`FloatingChat` (`plugins/redhat-ai-project-space/src/components/AIShowcasePage/FloatingChat.tsx`)
renders via `ReactDOM.createPortal` to `document.body`. This is a deliberate choice to escape the
plugin's container DOM and avoid CSS conflicts with Backstage's layout system.

Key implementation details:

- **Context building** — on mount, `buildAIProjectContext()` fetches all `ai`-namespace Component
  entities and converts them to prose descriptions. These are sent as `chunks` in the chat request
  body, providing the LLM with catalog knowledge without requiring a separate vector store.
- **Streaming** — the chat uses `ReadableStream` via `response.body.getReader()` to parse
  server-sent events (SSE) line by line. Each `data:` line contains a JSON payload with a
  `text_content` field that is appended to the conversation in real time.
- **Session management** — each chat window gets a UUID session ID (`uuid` v4). Clearing the
  conversation resets the session.
- **Abort control** — an `AbortController` ref allows cancelling in-flight requests when the
  chat window closes.
- **CSS override strategy** — the floating action button uses a multi-layered approach to force
  Red Hat brand red (`#EE0000`): inline styles, `sx` prop with `!important`, a global `<style>`
  tag injected into `document.head`, and direct `element.style.setProperty` calls. This is
  necessary because Backstage's theme system and MUI's style injection order can override
  component-level styles when rendered in a portal.

### Search Implementation

`searchFunction` in `plugins/redhat-ai-project-space/src/components/AIShowcasePage/utils.ts`
performs a recursive, case-insensitive substring search across the entire entity object tree. It
traverses strings, arrays, and nested objects. This is a brute-force approach that matches against
any field — annotations, tags, descriptions, spec values — without requiring a search index.

### UI Framework

The frontend uses Material UI v4 (`@material-ui/core`) for most components, consistent with
the Backstage component library's MUI v4 dependency. The `FloatingChat` component is the exception —
it imports from `@mui/material` (MUI v5) for `Box`, `Paper`, `TextField`, and other components.
This mixed-version usage works because the chat renders in a portal outside the main component tree,
reducing style collision risk.

`makeStyles` from `@material-ui/core/styles` is the dominant styling pattern for non-chat
components. The chat uses MUI v5's `sx` prop.

### Unused Dependencies

Two declared dependencies in `plugins/redhat-ai-project-space/package.json` have no import
references in the source code:

- **`graphql-request`** — not imported anywhere in `src/`. Likely a leftover from a removed feature
  or planned for future GraphQL integration.
- **`js-levenshtein`** — not imported anywhere in `src/`. May have been intended for fuzzy search
  matching but was superseded by the recursive substring search approach in `searchFunction`.

## Backend Plugin Internals

### Plugin Initialization

The backend plugin (`plugins/redhat-ai-project-space-backend/src/plugin.ts`) uses Backstage's
new backend system (`createBackendPlugin`). During initialization it:

1. Obtains a Knex database client from Backstage's `database` core service
2. Creates a `DatabaseHandler` (which runs migrations)
3. Creates an Express router
4. Registers the router with Backstage's HTTP router service
5. Declares `/health` as an unauthenticated route

### Router and API Endpoints

The router (`plugins/redhat-ai-project-space-backend/src/service/router.ts`) defines six
endpoints on an `express-promise-router` instance:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/health` | None | Health check (returns `{ status: "ok" }`) |
| `GET` | `/votes` | None | List all project vote aggregates |
| `GET` | `/votes/:projectId` | Optional | Get vote ratio for one project; includes `userVote` if authenticated |
| `POST` | `/votes/:projectId/upvote` | Required | Record an upvote from the authenticated user |
| `POST` | `/votes/:projectId/downvote` | Required | Record a downvote from the authenticated user |
| `DELETE` | `/votes/:projectId` | None | Delete aggregate votes for a project (admin/test use) |

Route ordering matters: `/votes` is registered before `/votes/:projectId` to prevent Express from
matching the literal path as a parameterized route.

### Request Validation

All endpoints that accept a `projectId` parameter validate it using Zod:

```typescript
const ProjectIdSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});
```

Zod errors are caught and returned as 400 responses with structured error details. This is the only
validation schema in the backend — the voting endpoints rely on the composite primary key constraint
rather than additional payload validation.

### Authentication

The backend uses Backstage's `HttpAuthService` and `AuthService` for identity extraction:

- **Write operations** (upvote/downvote) require a user principal. The handler extracts
  `credentials.principal.userEntityRef` and rejects requests without a valid user identity.
- **Read operations** (`GET /votes/:projectId`) optionally extract user identity to include the
  `userVote` field in the response. Authentication failures are silently caught and the request
  continues without user context.
- **`/health`** is explicitly registered as unauthenticated via `httpRouter.addAuthPolicy`.

### Database Layer

#### Schema Design

Two tables managed by Knex migrations in
`plugins/redhat-ai-project-space-backend/migrations/`:

**`project_votes`** (aggregate counters)

| Column | Type | Constraints |
|--------|------|-------------|
| `project_id` | string | Primary key, not null |
| `upvotes` | integer | Not null, default 0 |
| `downvotes` | integer | Not null, default 0 |
| `created_at` | timestamp | Not null, default now |
| `updated_at` | timestamp | Not null, default now |

Index: `idx_project_votes_updated_at` on `updated_at DESC`.

**`user_votes`** (per-user vote records)

| Column | Type | Constraints |
|--------|------|-------------|
| `user_ref` | string | Not null (composite PK part 1) |
| `project_id` | string | Not null (composite PK part 2) |
| `vote_type` | enum(`upvote`, `downvote`) | Not null |
| `created_at` | timestamp | Not null, default now |
| `updated_at` | timestamp | Not null, default now |

Primary key: `(user_ref, project_id)`. Indexes: `idx_user_votes_project_id`,
`idx_user_votes_user_ref`.

This is a **denormalized design** — `project_votes` stores precomputed aggregate counts rather than
computing them from `user_votes` on each read. The tradeoff is faster reads at the cost of
maintaining consistency between the two tables during writes.

#### Voting Logic

The `DatabaseHandler` (`plugins/redhat-ai-project-space-backend/src/database/DatabaseHandler.ts`)
implements three voting scenarios, all within Knex transactions:

1. **New vote** — inserts into `user_votes` and upserts into `project_votes` using
   `onConflict('project_id').merge()`. The upsert increments the relevant counter.
2. **Vote change** (e.g., upvote → downvote) — updates `user_votes.vote_type` and adjusts both
   counters in `project_votes` atomically (+1/-1).
3. **Duplicate vote** (same direction) — no-op. Returns the current ratio without modification.

The `resetVotes` method deletes from `project_votes` only. It does **not** cascade to `user_votes`,
which can leave orphaned user vote records. This method is intended for testing/admin purposes
and is exposed without authentication.

#### Database Portability

Backstage's `database` core service handles database client selection:

- **Development**: `better-sqlite3` with in-memory storage (configured in `app-config.yaml`)
- **Production**: PostgreSQL (configured in `app-config.production.yaml` via environment variables)

The migrations use standard SQL features and Knex's schema builder, which abstracts dialect
differences. One notable detail: `CREATE INDEX` statements use raw SQL
(`knex.schema.raw(...)`) rather than Knex's fluent index API — this works across both SQLite and
PostgreSQL but bypasses Knex's dialect abstraction for index creation.

The `enum` type for `vote_type` uses Knex's `table.enum()`, which maps to a `CHECK` constraint on
SQLite and a native `ENUM` type on PostgreSQL.

#### Migration Discovery

Migrations are located at runtime using `resolvePackagePath` from `@backstage/backend-plugin-api`:

```typescript
const migrationsDir = resolvePackagePath(
  'backstage-plugin-redhat-ai-project-space-backend',
  'migrations',
);
```

This resolves the `migrations/` directory relative to the installed package location, ensuring
migrations are found in both development (source tree) and production (packaged `dist/`) contexts.
The `package.json` `files` field includes `migrations` to ensure they ship with the package.

## Dynamic Plugin System

Both plugins support deployment as Janus-IDP dynamic plugins for Red Hat Developer Hub (RHDH). This
is an alternative to static bundling where plugins are loaded at runtime without rebuilding the
Backstage application.

### Export Process

Each plugin's `package.json` includes an `export-dynamic` script:

```
janus-cli package export-dynamic-plugin
```

This command (from `@janus-idp/cli`) transforms the built plugin into a self-contained package in
`dist-dynamic/` that can be loaded at runtime by RHDH's dynamic plugin loader.

### Build Script

`build.sh` automates the export-and-package workflow:

1. Cleans previous build artifacts (`dist`, `dist-dynamic`)
2. Runs `yarn workspace <name> export-dynamic`
3. Packs `dist-dynamic/` into an npm tarball
4. Computes a SHA-256 integrity hash (base64-encoded)
5. Outputs the tarball and integrity file to `build/<plugin-dir>/`

The integrity hash is used by RHDH to verify plugin package authenticity during installation.

### Backend Dynamic Entry Point

The backend plugin provides a dedicated entry point for dynamic loading at
`plugins/redhat-ai-project-space-backend/src/dynamic/index.ts`:

```typescript
export { redhatAiProjectSpacePlugin as default } from '../plugin';
```

This re-exports the plugin as the default export, which is the convention expected by the
Janus-IDP dynamic plugin loader.

### Frontend Dynamic Packaging

The frontend plugin's `package.json` includes `dist-scalprum` in its `files` array. Scalprum is
the micro-frontend framework used by RHDH to load frontend plugins dynamically. The
`janus-cli export-dynamic-plugin` command generates the Scalprum-compatible bundle in this
directory.

### RHDH Configuration

`plugins/redhat-ai-project-space-backend/app-config.janus-idp.yaml` provides the dynamic plugin
configuration for RHDH deployment, mapping the plugin to its API route:

```yaml
dynamicPlugins:
  backend:
    backstage-plugin-redhat-ai-project-space-backend:
      dynamicRoutes:
        - path: /api/redhat-ai-project-space-backend
          module: ./dist/index.cjs.js
```

## Catalog Entity Model

### Custom Annotation Namespace

AI projects are standard Backstage `Component` entities in the `ai` namespace. The plugin defines
a custom annotation namespace `ai.redhat.com/*` to carry domain-specific metadata:

| Annotation | Purpose | Example Values |
|------------|---------|----------------|
| `ai.redhat.com/category` | AI domain classification | Natural Language Processing, Computer Vision |
| `ai.redhat.com/usecase` | Business use case | Customer Support, Quality Assurance |
| `ai.redhat.com/status` | Deployment status | Production, Beta |
| `ai.redhat.com/domain` | Internal vs. external | internal, external |
| `ai.redhat.com/featured` | Highlighted project flag | true, false |
| `ai.redhat.com/maturity` | Project maturity level | graduated, incubating, sandbox |
| `ai.redhat.com/velocity` | External tracking ID | (free-form string) |

The `getAnnotation` utility reads these annotations with a fallback of `'-'` for missing values.
The maturity annotation drives visual differentiation — card background colors and chip colors are
mapped to maturity levels (orange for graduated, blue for incubating, green for sandbox).

### Entity Filtering

The frontend filters entities by `metadata.namespace: 'ai'` and `kind: 'Component'` in its Catalog
API query. Only entities matching both criteria appear in the showcase. This namespace-based
partitioning means AI projects can coexist with standard catalog entries without interference.

### Project Identity

Project IDs for the voting system are constructed as `{namespace}/{kind}/{name}` (e.g.,
`ai/component/ai-chatbot-assistant`). This format mirrors Backstage's entity reference format and
ensures uniqueness within the catalog.

### Sample Catalog Data

`catalog_default/components/ai-projects.yaml` provides ten sample AI project entities spanning
categories like NLP, Computer Vision, Predictive Analytics, and Code Generation. These entities
are registered via `app-config.yaml`'s catalog locations and serve as development seed data.

## Dev Harness Wiring

### Frontend (`packages/app/`)

The dev harness app registers the plugin in two places:

1. **API registration** (`packages/app/src/apis.ts`) — creates a `ProjectVotesClient` factory,
   binding `projectVotesApiRef` to `discoveryApi` and `fetchApi` dependencies. This is technically
   redundant with the plugin's own API factory registration in `plugin.ts`, but ensures the API is
   available even if plugin auto-registration order varies.
2. **Route mounting** (`packages/app/src/App.tsx`) — renders `AIShowcasePageComponent` at
   `/ai-showcase` and adds a sidebar entry labeled "AI Showcase".

### Backend (`packages/backend/`)

The dev harness backend (`packages/backend/src/index.ts`) uses the new Backstage backend system.
It imports and registers the backend plugin alongside standard Backstage plugins (catalog, auth,
proxy, search, etc.). The permission backend uses `allow-all-policy` for development, and auth
uses the guest provider.

Both harness packages reference the plugin packages via Yarn `link:` protocol for live development.

## Error Handling Patterns

### Backend

All router endpoints follow a consistent pattern:
1. Validate input with Zod (return 400 for validation failures)
2. Execute database operations in a try/catch
3. Return 500 with a generic error message on unexpected failures
4. Log errors via Backstage's logger service

The router uses `MiddlewareFactory.create().error()` as a final error-handling middleware.

### Frontend

- **Catalog fetch failures** — caught and displayed as an error string in the page
- **Vote API failures** — caught per-operation and logged to console; the UI remains functional
  with stale vote data
- **Chat failures** — categorized by error type (network, HTTP, stream interruption, empty
  response) with user-friendly messages displayed in the conversation. Aborted requests (from
  closing the chat) are silently discarded.
- **Context loading failures** — if `buildAIProjectContext` fails, the chat displays a specific
  error message asking the user to refresh.

## Configuration

The plugin relies on standard Backstage configuration via `app-config.yaml`:

- **`backend.baseUrl`** — used by `FloatingChat` to construct the proxy URL for the LLM service
- **`backend.database`** — determines the database client (SQLite for dev, PostgreSQL for prod)
- **`proxy`** — must include a `/tangerine` endpoint configuration for the chat feature to
  function (not present in the default config; requires deployment-specific setup)
- **`catalog.locations`** — must include the AI projects YAML file for entities to appear

No plugin-specific configuration keys are defined. The backend plugin receives its database
connection from Backstage's core database service, and the frontend plugin resolves the backend URL
through the standard discovery mechanism.

## Key Design Tradeoffs

### Knex Over Other ORMs

Knex is used as a query builder rather than a full ORM (like TypeORM or Prisma). This aligns with
Backstage's own database conventions — the Backstage core and most official plugins use Knex.
Using the same query builder reduces dependency conflicts and follows the principle of least
surprise for Backstage developers. The tradeoff is less type safety at the query level compared to
Prisma's generated types.

### Denormalized Vote Aggregates

The two-table vote schema (`project_votes` for aggregates, `user_votes` for per-user records)
trades storage normalization for read performance. Reads (`getAllVotes`, `getVoteRatio`) hit a
single row in `project_votes` rather than counting rows in `user_votes`. The cost is maintaining
transactional consistency during writes and the `resetVotes` orphan risk noted above.

### Portal-Based Chat Rendering

Rendering `FloatingChat` via `createPortal` to `document.body` solves the CSS containment problem
(Backstage's layout system would clip or mis-position a fixed-position overlay), but introduces
the aggressive CSS override strategy for the floating button. The alternative — rendering within
the plugin's component tree — would require fighting Backstage's scrollable content area and
z-index stack.

### MUI v4/v5 Mixed Usage

The main plugin uses MUI v4 to match Backstage's component library. `FloatingChat` uses MUI v5
imports, likely because the portal rendering isolates it from the MUI v4 theme context. This is
pragmatic but adds bundle size from shipping two MUI versions. If the Backstage upstream migrates
to MUI v5, the v4 imports in the main plugin should follow.

### Catalog-Driven Filter Options

Filter dropdowns are dynamically populated from the actual entity data rather than from a hardcoded
list. This means adding a new category or maturity level requires only updating entity annotations
— no code changes needed. The tradeoff is that filter options can be inconsistent if entity
annotations use varied casing or spelling (e.g., "NLP" vs "Natural Language Processing").

### Brute-Force Full-Text Search

The `searchFunction` recursively traverses the entire entity object for substring matches. This is
simple and requires no infrastructure (no search index, no Backstage Search integration), but it
scales linearly with entity count and object depth. For the expected scale (tens to low hundreds
of AI projects), this is adequate. A Backstage Search collator would be more appropriate at larger
scale.
