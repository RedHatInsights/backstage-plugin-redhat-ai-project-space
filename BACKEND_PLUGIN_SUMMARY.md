# Red Hat AI Project Space Backend Plugin - Summary

## ✅ What Was Created

A complete backend plugin for persisting upvotes and downvotes for AI projects has been successfully created and integrated into your Backstage monorepo.

### Plugin Location
```
plugins/redhat-ai-project-space-backend/
```

### Key Features

1. **Database Persistence** 
   - SQLite for development (in-memory)
   - PostgreSQL support for production
   - Automatic database migrations
   - Upsert logic for vote counting

2. **RESTful API Endpoints**
   - `GET /api/redhat-ai-project-space-backend/votes/:projectId` - Get vote ratio for a project
   - `GET /api/redhat-ai-project-space-backend/votes` - Get all votes
   - `POST /api/redhat-ai-project-space-backend/votes/:projectId/upvote` - Upvote a project
   - `POST /api/redhat-ai-project-space-backend/votes/:projectId/downvote` - Downvote a project
   - `DELETE /api/redhat-ai-project-space-backend/votes/:projectId` - Reset votes (admin)
   - `GET /api/redhat-ai-project-space-backend/health` - Health check

3. **Dynamic Plugin Support**
   - Fully configured for Red Hat Developer Hub
   - Export command: `yarn export-dynamic`
   - Build script in Makefile: `make build-backend-plugin`

4. **Development Integration**
   - Wired into the development backend
   - Works in the monorepo setup
   - Ready for local development and testing

## 📁 File Structure

```
plugins/redhat-ai-project-space-backend/
├── src/
│   ├── database/
│   │   └── DatabaseHandler.ts          # Database operations with Knex
│   ├── service/
│   │   └── router.ts                   # Express router with API endpoints
│   ├── dynamic/
│   │   └── index.ts                    # Dynamic plugin entry point
│   ├── plugin.ts                       # Plugin definition (new backend system)
│   ├── plugin.test.ts                  # Unit tests
│   ├── index.ts                        # Main entry point
│   └── setupTests.ts                   # Test setup
├── migrations/
│   └── 20241104_initial_votes_table.js # Database schema migration
├── package.json                         # Dependencies and scripts
├── tsconfig.json                        # TypeScript configuration
├── app-config.janus-idp.yaml           # Dynamic plugin configuration
├── README.md                            # API documentation
├── DEVELOPMENT.md                       # Developer guide
└── .gitignore                          # Git ignore rules
```

## 🗄️ Database Schema

### `project_votes` Table

| Column | Type | Description |
|--------|------|-------------|
| project_id | string (PK) | Unique identifier for the project |
| upvotes | integer | Number of upvotes (default: 0) |
| downvotes | integer | Number of downvotes (default: 0) |
| created_at | timestamp | When the record was created |
| updated_at | timestamp | When the record was last updated |

## 🚀 Getting Started

### 1. Start the Development Backend

```bash
# From repository root
yarn start-backend
```

The plugin API will be available at: `http://localhost:7007/api/redhat-ai-project-space-backend`

### 2. Test the API

```bash
# Health check
curl http://localhost:7007/api/redhat-ai-project-space-backend/health

# Upvote a project
curl -X POST http://localhost:7007/api/redhat-ai-project-space-backend/votes/my-project-id/upvote

# Get vote ratio
curl http://localhost:7007/api/redhat-ai-project-space-backend/votes/my-project-id
```

### 3. Build for Production

```bash
# Build dynamic plugin
make build-backend-plugin

# Or manually:
cd plugins/redhat-ai-project-space-backend
yarn export-dynamic
```

## 🔌 Integration Points

### Backend Integration

The plugin is already wired into your development backend:

**File:** `packages/backend/src/index.ts`
```typescript
// redhat-ai-project-space backend plugin
backend.add(import('backstage-plugin-redhat-ai-project-space-backend'));
```

**File:** `packages/backend/package.json`
```json
{
  "dependencies": {
    "backstage-plugin-redhat-ai-project-space-backend": "link:../../plugins/redhat-ai-project-space-backend"
  }
}
```

### Frontend Integration (Next Steps)

To integrate with your frontend plugin (`plugins/redhat-ai-project-space`), you'll need to:

1. Create an API client in the frontend plugin
2. Add API calls to the backend endpoints
3. Update the UI to display vote counts and buttons
4. Use the Backstage `fetchApi` or similar utility

Example API client setup:
```typescript
import { createApiRef, DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

export const projectVotesApiRef = createApiRef<ProjectVotesApi>({
  id: 'plugin.redhat-ai-project-space.votes',
});

export class ProjectVotesClient implements ProjectVotesApi {
  constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  async upvote(projectId: string): Promise<VoteRatio> {
    const baseUrl = await this.discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
    const response = await this.fetchApi.fetch(
      `${baseUrl}/votes/${projectId}/upvote`,
      { method: 'POST' }
    );
    return response.json();
  }

  // ... other methods
}
```

## 📊 API Response Format

### Vote Ratio Response

```json
{
  "projectId": "project-123",
  "upvotes": 10,
  "downvotes": 2,
  "ratio": 0.833,
  "total": 12
}
```

- `ratio`: Upvotes / Total votes (0-1)
- `total`: Sum of upvotes and downvotes

## 🔧 Configuration

### Development (SQLite)

Already configured in `app-config.yaml`:
```yaml
backend:
  database:
    client: better-sqlite3
    connection: ':memory:'
```

### Production (PostgreSQL)

Configure in `app-config.production.yaml`:
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
```

The plugin will automatically use the configured database.

## ✅ What's Working

- ✅ Plugin builds successfully
- ✅ TypeScript compilation passes
- ✅ No linter errors
- ✅ Dynamic plugin export works
- ✅ Wired into development backend
- ✅ Database migrations ready
- ✅ API routes defined with validation
- ✅ Comprehensive documentation

## 📝 Next Steps

1. **Start the backend** and test the API endpoints
2. **Create frontend API client** to call the backend
3. **Update UI components** to display votes and add voting buttons
4. **Test the full flow** from frontend to backend
5. **Deploy to Red Hat Developer Hub** when ready

## 📚 Documentation

- **README.md**: API documentation and usage guide
- **DEVELOPMENT.md**: Development setup and architecture details
- **Plugin source**: Extensively commented code

## 🎯 Technical Highlights

- **New Backend System**: Uses `createBackendPlugin` for modern Backstage architecture
- **Type Safety**: Zod schema validation for API inputs
- **Database Abstraction**: Clean separation with `DatabaseHandler` class
- **Upsert Logic**: Atomic increment operations for vote counting
- **Production Ready**: Supports both SQLite and PostgreSQL
- **Dynamic Plugin**: Ready for Red Hat Developer Hub deployment

## 🧪 Testing

Run tests:
```bash
cd plugins/redhat-ai-project-space-backend
yarn test
```

## 🛠️ Troubleshooting

If you encounter issues:

1. **Dependencies**: Run `yarn install` from the root
2. **Build**: Run `yarn tsc` then `yarn build` in the plugin directory
3. **Backend**: Check logs when starting with `yarn start-backend`
4. **Database**: Verify connection settings in app-config

See `DEVELOPMENT.md` for detailed troubleshooting guide.

---

**Created:** November 4, 2025
**Plugin Version:** 1.0.0
**Backstage Compatibility:** ^0.29.6

