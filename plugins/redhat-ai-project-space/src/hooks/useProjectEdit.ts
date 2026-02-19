import { useCallback } from 'react';
import { Entity } from '@backstage/catalog-model';
import { prepareProjectEditData, generateComponentYAML } from '../api/GitLabApi';
import { useApi, discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { gitlabApiClientRef } from '../api/GitLabApiClient';

/**
 * Hook to handle project editing functionality.
 * This hook provides a function to initiate the edit flow for existing projects.
 */
export function useProjectEdit() {
  const gitlabApiClient = useApi(gitlabApiClientRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  /**
   * Initiates the edit flow for a project by:
   * 1. Reading the current project YAML configuration from the main branch
   * 2. Parsing the configuration and extracting all metadata
   * 3. Redirecting to the edit template with pre-filled form data
   *
   * The edit template will then validate and commit changes directly to main.
   *
   * @param entity - The Backstage entity representing the project
   * @returns Promise that resolves when the edit flow is initiated
   */
  const handleEdit = useCallback(
    async (entity: Entity) => {
      console.log('[useProjectEdit] handleEdit called for:', entity.metadata.name);

      try {
        console.log('[useProjectEdit] Calling prepareProjectEditData...');
        const editData = await prepareProjectEditData(entity, gitlabApiClient);

        console.log('[useProjectEdit] Edit data prepared:', editData);

        if (!editData) {
          throw new Error('Failed to load project data');
        }

        // Simple inline editing with prompt
        const newTitle = window.prompt(
          `Edit title for project "${editData.projectName}":`,
          editData.title || ''
        );

        if (!newTitle || newTitle === editData.title) {
          console.log('[useProjectEdit] Edit cancelled or no changes');
          return; // User cancelled or no changes
        }

        console.log('[useProjectEdit] New title:', newTitle);
        editData.title = newTitle;

        // Generate new YAML
        const yamlContent = generateComponentYAML(editData);
        console.log('[useProjectEdit] Generated YAML, length:', yamlContent.length);

        // Save to GitLab
        const backendUrl = await discoveryApi.getBaseUrl('redhat-ai-project-space-backend');
        console.log('[useProjectEdit] Backend URL:', backendUrl);

        const response = await fetchApi.fetch(`${backendUrl}/gitlab/file`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: editData.projectId,
            filePath: editData.componentPath,
            branch: 'main',
            content: yamlContent,
            commitMessage: `Update ${editData.projectName}: ${newTitle}`,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update: ${response.statusText}`);
        }

        console.log('[useProjectEdit] Update successful!');
        alert(`✅ Project "${editData.projectName}" updated!\n\nNew title: ${newTitle}\n\nChanges will appear in the catalog soon.`);
        window.location.reload();
      } catch (error) {
        console.error('[useProjectEdit] Error:', error);
        throw error;
      }
    },
    [gitlabApiClient, discoveryApi, fetchApi],
  );

  return { handleEdit };
}
