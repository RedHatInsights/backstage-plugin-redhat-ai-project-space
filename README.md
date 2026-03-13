# Red Hat AI Project Space - Backstage Plugin

A Backstage plugin for showcasing and exploring AI/ML projects within your organization. This plugin provides an interactive showcase page with advanced filtering, search, voting capabilities, and a floating chat interface.

## Features

- **Project Showcase**: Display AI/ML projects from your Backstage catalog with rich metadata
- **Advanced Filtering**: Filter projects by:
  - Category (e.g., Natural Language Processing, Computer Vision)
  - Use Case (e.g., Customer Support, Quality Assurance)
  - Status (e.g., Production, Development)
  - Domain (internal/external)
  - Maturity Level (graduated, incubating, sandbox)
  - Featured projects
  - Tags (multi-select)
- **Search**: Real-time search across project names, descriptions, and metadata
- **Voting System**: Upvote/downvote projects with persistent vote tracking
- **Sorting**: Sort projects alphabetically or by vote count
- **Floating Chat**: Interactive chat interface for project assistance
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Architecture

The plugin consists of two packages:

1. **Frontend Plugin** (`plugins/redhat-ai-project-space`): React-based UI components for the showcase page
2. **Backend Plugin** (`plugins/redhat-ai-project-space-backend`): REST API for voting functionality with database persistence

## Prerequisites

- Node.js 22+ and Yarn
- A running Backstage instance (v1.x)
- PostgreSQL or SQLite database (for vote persistence)

## Installation

### 1. Install Dependencies

From the root of your Backstage project:

```bash
yarn install
```

### 2. Add Backend Plugin

The backend plugin is already registered in `packages/backend/src/index.ts`:

```typescript
// redhat ai project space plugin
backend.add(import('backstage-plugin-redhat-ai-project-space-backend'));
```

### 3. Add Frontend Plugin

The frontend component is imported in `packages/app/src/App.tsx`:

```typescript
import { AIShowcasePageComponent } from 'backstage-plugin-redhat-ai-project-space';

// ... in routes
<Route path="/ai-showcase" element={<AIShowcasePageComponent />} />
```

### 4. Configure Catalog

Add your AI projects to the catalog. Update `app-config.yaml`:

```yaml
catalog:
  locations:
    # AI Showcase projects catalog
    - type: file
      target: ../../catalog_default/components/ai-projects.yaml
      rules:
        - allow: [Component, System, API, Resource]
```

### 5. Create AI Projects

Create catalog entries for your AI projects in `catalog_default/components/ai-projects.yaml`:

```yaml
---
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ai-chatbot-assistant
  namespace: ai  # Important: must be in 'ai' namespace
  title: AI Chatbot Assistant
  description: |
    Intelligent chatbot powered by large language models.
  tags:
    - ai
    - chatbot
    - nlp
  annotations:
    ai.redhat.com/category: 'Natural Language Processing'
    ai.redhat.com/usecase: 'Customer Support'
    ai.redhat.com/status: 'Production'
    ai.redhat.com/domain: 'internal'
    ai.redhat.com/featured: 'true'
    ai.redhat.com/maturity: 'graduated'
spec:
  type: service
  lifecycle: production
  owner: ai-team
```

## Running Locally

### Start the Backend

From the project root:

```bash
yarn install
yarn dev
```

This will start:
- Backend on `http://localhost:7007`
- Frontend on `http://localhost:3000`

### Access the Plugin

Navigate to: `http://localhost:3000/ai-showcase`

## Configuration

### Database Setup

The backend plugin uses the Backstage database configuration. For local development, it uses SQLite in-memory by default (configured in `app-config.yaml`):

```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
```

For production, configure PostgreSQL in `app-config.production.yaml`:

```yaml
backend:
  database:
    client: pg
    connection:
      host: ${POSTGRES_HOST}
      port: ${POSTGRES_PORT}
      user: ${POSTGRES_USER}
      password: ${POSTGRES_PASSWORD}
      database: ${POSTGRES_DB}
```

### Supported Annotations

The plugin recognizes these custom annotations on catalog entities:

| Annotation | Description | Example Values |
|------------|-------------|----------------|
| `ai.redhat.com/category` | AI/ML category | Natural Language Processing, Computer Vision |
| `ai.redhat.com/usecase` | Primary use case | Customer Support, Quality Assurance |
| `ai.redhat.com/status` | Project status | Production, Development, Experimental |
| `ai.redhat.com/domain` | Deployment domain | internal, external |
| `ai.redhat.com/featured` | Feature on homepage | true, false |
| `ai.redhat.com/maturity` | Project maturity | graduated, incubating, sandbox |

## Project Structure

```
.
├── packages/
│   ├── app/                    # Backstage frontend app
│   └── backend/                # Backstage backend app
├── plugins/
│   ├── redhat-ai-project-space/           # Frontend plugin
│   │   ├── src/
│   │   │   ├── api/           # API client for backend
│   │   │   ├── components/    # React components
│   │   │   │   └── AIShowcasePage/
│   │   │   │       ├── AIShowcasePage.tsx
│   │   │   │       ├── FilterSidebar.tsx
│   │   │   │       ├── ProjectCard.tsx
│   │   │   │       ├── ProjectsList.tsx
│   │   │   │       ├── SearchBar.tsx
│   │   │   │       ├── VoteButtons.tsx
│   │   │   │       └── FloatingChat.tsx
│   │   │   └── plugin.ts
│   │   └── package.json
│   └── redhat-ai-project-space-backend/   # Backend plugin
│       ├── src/
│       │   ├── database/      # Database handlers
│       │   ├── service/       # REST API routes
│       │   └── plugin.ts
│       ├── migrations/        # Database migrations
│       └── package.json
└── catalog_default/
    └── components/
        └── ai-projects.yaml   # Sample AI projects
```

## Development

### Building the Plugin

```bash
# Build frontend plugin
cd plugins/redhat-ai-project-space
yarn build

# Build backend plugin
cd plugins/redhat-ai-project-space-backend
yarn build
```

### Running Tests

```bash
# Run all tests
yarn test

# Run tests for specific plugin
cd plugins/redhat-ai-project-space
yarn test
```

### Linting

```bash
# Lint all code
yarn lint

# Fix linting issues
yarn lint:fix
```

### Export as Dynamic Plugin

Both plugins support dynamic plugin export for use with Janus IDP:

```bash
# Frontend plugin
cd plugins/redhat-ai-project-space
yarn export-dynamic

# Backend plugin
cd plugins/redhat-ai-project-space-backend
yarn export-dynamic
```

## API Reference

### Backend API Endpoints

The backend plugin exposes the following REST API:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/redhat-ai-project-space-backend/votes/:projectId/upvote` | Upvote a project |
| `POST` | `/api/redhat-ai-project-space-backend/votes/:projectId/downvote` | Downvote a project |
| `GET` | `/api/redhat-ai-project-space-backend/votes/:projectId` | Get vote ratio for project |
| `GET` | `/api/redhat-ai-project-space-backend/votes` | Get all vote ratios |
| `GET` | `/api/redhat-ai-project-space-backend/health` | Health check endpoint |

### Frontend API

The frontend plugin exports:

```typescript
import {
  redhatAIProjectSpacePlugin,
  AIShowcasePageComponent,
  projectVotesApiRef,
  ProjectVotesClient
} from 'backstage-plugin-redhat-ai-project-space';
```

---

Built with ❤️ for the Red Hat AI community
