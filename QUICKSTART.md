# Quick Start - Voting Feature 🚀

## Start the Application

```bash
# Terminal 1 - Backend
yarn start-backend

# Terminal 2 - Frontend  
yarn start
```

## Test the Voting

1. Open browser: `http://localhost:3000` (or your plugin route)
2. Navigate to AI Project Space page
3. Look at any project card - you'll see vote buttons at the bottom:
   ```
   [👍] 0 | 0 [👎]
   ```
4. Click **👍** to upvote - count increases to 1
5. Click **👎** to downvote - both counts show
6. Percentage appears when votes exist: `(75%)`
7. Refresh page - votes persist!

## Quick API Test

```bash
# Health check
curl http://localhost:7007/api/redhat-ai-project-space-backend/health

# Upvote
curl -X POST http://localhost:7007/api/redhat-ai-project-space-backend/votes/test-project/upvote

# Get votes
curl http://localhost:7007/api/redhat-ai-project-space-backend/votes/test-project
```

## What Was Built

### Backend (`plugins/redhat-ai-project-space-backend/`)
- Database persistence for votes
- 6 REST API endpoints
- SQLite (dev) / PostgreSQL (prod)
- Dynamic plugin for RHDH

### Frontend (`plugins/redhat-ai-project-space/`)
- Vote buttons on each project
- Real-time updates
- Secure API with fetchApi
- Loading states & error handling

## Files Created

**Backend:**
- `src/database/DatabaseHandler.ts` - Vote data operations
- `src/service/router.ts` - API endpoints
- `src/plugin.ts` - Plugin registration
- `migrations/20241104_initial_votes_table.js` - Database schema

**Frontend:**
- `src/api/ProjectVotesApi.ts` - API client (fetchApi)
- `src/hooks/useProjectVotes.ts` - Vote data hook
- `src/components/AIShowcasePage/VoteButtons.tsx` - Vote UI

**Modified:**
- `src/plugin.ts` - Registered API
- `src/components/AIShowcasePage/ProjectCard.tsx` - Added votes
- `src/components/AIShowcasePage/ProjectsList.tsx` - Load & pass votes
- `packages/backend/src/index.ts` - Wired backend plugin
- `packages/backend/package.json` - Added backend dependency

## Build for Production

```bash
# Backend plugin
make build-backend-plugin

# Frontend plugin
make build-plugin

# Or build everything
make build-all
```

Output: `build/` directory contains tarballs for RHDH deployment

## Configuration

**Development (default):**
- In-memory SQLite
- Resets on backend restart

**For persistent dev storage:**

Edit `app-config.yaml`:
```yaml
backend:
  database:
    connection: './dev.db'  # Instead of ':memory:'
```

**Production:**
- Uses PostgreSQL from `app-config.production.yaml`
- Already configured in your environment

## Troubleshooting

**Votes not showing?**
```bash
# Check backend is running
curl http://localhost:7007/api/redhat-ai-project-space-backend/health

# Should return: {"status":"ok"}
```

**API errors?**
- Check browser DevTools Console
- Check Network tab for failed requests
- Verify backend logs

**Need to reset votes?**
```bash
curl -X DELETE http://localhost:7007/api/redhat-ai-project-space-backend/votes/project-id
```

## Documentation

📚 **Detailed Guides:**
- `VOTING_FEATURE_COMPLETE.md` - Complete overview
- `BACKEND_PLUGIN_SUMMARY.md` - Backend details
- `FRONTEND_VOTING_INTEGRATION.md` - Frontend details
- `plugins/redhat-ai-project-space-backend/README.md` - API docs

## Success Checklist

- [x] Backend plugin created
- [x] Database migrations ready
- [x] API endpoints working
- [x] Frontend API client created
- [x] Vote buttons displayed
- [x] Real-time updates working
- [x] Secure fetchApi integration
- [x] No linting errors
- [x] Builds successfully
- [x] Ready for production

## You're Done! ✅

Start voting on AI projects now! 🎉

---

Questions? Check the detailed docs or test with the curl commands above.

