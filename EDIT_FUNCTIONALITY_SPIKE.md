# Edit Functionality Spike - AI Project Space Plugin

## Overview

This document describes the spike work done to implement edit functionality for AI projects in the Backstage AI Project Space plugin. The goal was to allow users to edit existing AI project configurations and save changes directly to GitLab **without creating pull requests**.

## Problem Statement

Users needed a way to edit existing AI project metadata (title, description, tags, category, use case, owner, domain, status, featured flag, etc.) and save changes directly to the `main` branch in GitLab, bypassing the PR workflow.

## Proposed Solutions

We implemented **two different approaches** to provide edit functionality:

---

### Solution 1: Template-based Edit

**Approach:** Navigate to a Backstage Scaffolder template with pre-filled form data.

**How it works:**
1. User clicks "Edit 1" button on a project card
2. Browser navigates to the edit template URL with query parameters
3. The `formData` parameter contains all current project values
4. Template form displays with all fields pre-populated
5. User modifies fields and submits the template
6. Template displays a summary of the changes

**URL format:**
```
/create/templates/default/edit-ai-project?formData=<url-encoded-json>
```

**Template location:**
```
rhdh-local/configs/catalog-entities/template-edit-ai-project.yaml
```

**Key implementation details:**

```typescript
// Build formData with current project values
const formData = {
  projectId: 'jbarea/ai-showcase-test',
  componentPath: `entities/ai/components/${entity.metadata.name}/${entity.metadata.name}.yaml`,
  projectName: entity.metadata.name,
  title: entity.metadata.title,
  description: entity.metadata.description,
  tags: entity.metadata.tags,
  category: category,
  usecase: usecase,
  owner: owner,
  domain: domain,
  status: status,
  featured: featured,
  // ... repository info
};

// Navigate to template with pre-filled data
const editUrl = `/create/templates/default/edit-ai-project?formData=${encodeURIComponent(JSON.stringify(formData))}`;
```

**Advantages:**
- Leverages native Backstage scaffolder system
- Form fields defined declaratively in YAML
- Can add validation rules in template
- Familiar UX for Backstage users

**Disadvantages:**
- Requires template to be properly loaded in catalog
- More complex setup (template YAML + catalog configuration)
- Navigation-based (leaves current page)
- Currently shows summary only (no actual save implemented in POC)

---

### Solution 2: Modal-based Edit ✅ (Recommended)

**Approach:** Open an inline modal dialog and save directly to GitLab via backend API.

**How it works:**
1. User clicks "Edit 2" button on a project card
2. Modal dialog opens with all project fields
3. User modifies fields in the modal
4. User clicks "Save Changes"
5. Frontend generates updated YAML
6. Frontend calls backend API endpoint
7. Backend commits changes directly to `main` branch in GitLab
8. Success message shown, page reloads

**Key implementation details:**

**Frontend - Modal and save handler:**
```typescript
const handleSave = async () => {
  // Generate YAML with updated values
  const componentYaml = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: entity.metadata.name,
      title: editedTitle,
      description: editedDescription,
      annotations: {
        'ai.redhat.com/category': editedCategory,
        'ai.redhat.com/usecase': editedUsecase,
        'ai.redhat.com/owner': editedOwner,
        'ai.redhat.com/status': editedStatus,
        'ai.redhat.com/domain': editedDomain,
        'ai.redhat.com/featured': editedFeatured ? 'true' : 'false',
      },
      tags: editedTags.split(',').map(t => t.trim()).filter(t => t),
    },
    spec: entity.spec,
  };

  const yamlContent = yaml.dump(componentYaml);

  // Call backend API to save
  const backendUrl = await discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
  const response = await fetchApi.fetch(`${backendUrl}/gitlab/file`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: 'jbarea/ai-showcase-test',
      filePath: `entities/ai/components/${entity.metadata.name}/${entity.metadata.name}.yaml`,
      branch: 'main',
      content: yamlContent,
      commitMessage: `Update ${entity.metadata.name}: ${editedTitle}`,
    }),
  });

  if (!response.ok) throw new Error('Failed to update');

  alert('✅ Project updated successfully!');
  window.location.reload();
};
```

**Backend - GitLab API integration:**
```typescript
router.put('/gitlab/file', async (request, response) => {
  await httpAuth.credentials(request);

  const { projectId, filePath, branch, content, commitMessage } =
    GitLabUpdateFileSchema.parse(request.body);

  // Get GitLab token from configuration
  const gitlabToken = config
    .getOptionalConfigArray('integrations.gitlab')[0]
    .getOptionalString('token');

  // Update file via GitLab API
  const url = `https://gitlab.cee.redhat.com/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}`;

  const gitlabResponse = await fetch(url, {
    method: 'PUT',
    headers: {
      'PRIVATE-TOKEN': gitlabToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      branch,
      content,
      commit_message: commitMessage,
    }),
  });

  response.json(await gitlabResponse.json());
});
```

**Advantages:**
- ✅ **Fully functional** - saves directly to GitLab main branch
- ✅ **No PRs required** - commits directly
- Inline UX - stays on same page
- Immediate feedback with loading state
- Simple architecture - no template dependencies
- Backend handles authentication with service token

**Disadvantages:**
- Form fields defined in React code (less flexible than YAML)
- Requires backend API endpoint
- Page reload needed to see changes in catalog

---

## Configuration Required

### GitLab Token Setup

Add GitLab integration in `app-config.yaml`:

```yaml
integrations:
  gitlab:
    - host: gitlab.cee.redhat.com
      token: ${GITLAB_TOKEN}
      apiBaseUrl: https://gitlab.cee.redhat.com/api/v4
```

Set `GITLAB_TOKEN` environment variable with a GitLab Personal Access Token that has `api` scope.

### Catalog Configuration (for Solution 1 only)

```yaml
catalog:
  locations:
    - type: file
      target: /opt/app-root/src/configs/catalog-entities/template-edit-ai-project.yaml
      rules:
        - allow: [Template]
```

## Recommendation

**Solution 2 (Modal-based Edit)** is the recommended approach because:

1. **It works end-to-end** - actually commits changes to GitLab
2. **Direct to main** - no PR workflow required
3. **Better UX** - inline modal, no navigation
4. **Simpler** - no template dependencies
5. **Reliable** - doesn't depend on catalog ingestion timing

Solution 1 can be kept as an alternative or removed if not needed.

## Security Considerations

- Backend uses service account token (`GITLAB_TOKEN`) instead of user OAuth tokens
- Avoids OAuth scope issues
- Backend validates all requests with `httpAuth.credentials()`
- Input validation with Zod schemas
- Direct commits to main require appropriate GitLab token permissions

## Repository Details

- **GitLab repository:** `gitlab.cee.redhat.com/jbarea/ai-showcase-test`
- **Component files:** `entities/ai/components/{project-name}/{project-name}.yaml`
- **Branch:** `main` (direct commits, no PRs)

## Testing

1. Start RHDH with the plugin installed
2. Navigate to `/ai-projects`
3. Click "Edit 1" to test template approach (shows form only)
4. Click "Edit 2" to test modal approach (full save functionality)
5. Verify changes committed directly to GitLab main branch
6. Wait for catalog refresh to see updated values
