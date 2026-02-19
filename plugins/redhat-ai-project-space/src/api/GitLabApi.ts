import { Entity } from '@backstage/catalog-model';
import * as yaml from 'js-yaml';
import { GitLabApiClient } from './GitLabApiClient';

/**
 * Generates YAML content for a component from ProjectEditData
 */
export function generateComponentYAML(data: ProjectEditData): string {
  const component: any = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: data.projectName,
      title: data.title,
      description: data.description,
      annotations: {
        'ai.redhat.com/category': data.category || '',
        'ai.redhat.com/usecase': data.usecase || '',
        'ai.redhat.com/owner': data.owner || '',
        'ai.redhat.com/status': data.status || '',
        'ai.redhat.com/domain': data.domain || '',
        'ai.redhat.com/featured': data.featured ? 'true' : 'false',
      },
    },
    spec: {
      type: 'ai-component',
      lifecycle: 'production',
      owner: 'ai-engineering',
    },
  };

  // Add tags if present
  if (data.tags && data.tags.length > 0) {
    component.metadata.tags = data.tags;
  }

  // Add repository annotations based on type
  if (data.repoType === 'GitHub' && data.githubUrl) {
    const githubSlug = data.githubUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
    component.metadata.annotations['github.com/project-slug'] = githubSlug;
    component.metadata.annotations['backstage.io/techdocs-ref'] = `url:${data.githubUrl}`;
    component.metadata.annotations['backstage.io/source-location'] = `url:${data.githubUrl}/`;
  } else if (data.repoType === 'GitLab' && data.gitlabUrl) {
    const gitlabSlug = data.gitlabUrl.replace(new RegExp(`^https?://${data.gitlabInstance}/`), '').replace(/\/$/, '');
    component.metadata.annotations['gitlab.com/instance'] = data.gitlabInstance || '';
    component.metadata.annotations['gitlab.com/project-slug'] = gitlabSlug;
    component.metadata.annotations['backstage.io/techdocs-ref'] = `url:${data.gitlabUrl}`;
    component.metadata.annotations['backstage.io/source-location'] = `url:${data.gitlabUrl}/`;
  }

  return yaml.dump(component, { lineWidth: -1, noRefs: true });
}

export interface ProjectEditData {
  projectId: string; // GitLab project ID (encoded path)
  componentPath: string;
  projectName: string; // slug (metadata.name)
  title?: string; // metadata.title
  description?: string;
  tags?: string[];
  category?: string;
  usecase?: string;
  owner?: string; // ai.redhat.com/owner (not spec.owner)
  domain?: string;
  status?: string;
  featured?: boolean;
  // Repository information
  repoType?: 'GitHub' | 'GitLab';
  githubUrl?: string;
  gitlabUrl?: string;
  gitlabInstance?: string;
}

interface ComponentYaml {
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    annotations?: {
      'ai.redhat.com/category'?: string;
      'ai.redhat.com/usecase'?: string;
      'ai.redhat.com/owner'?: string;
      'ai.redhat.com/status'?: string;
      'ai.redhat.com/domain'?: string;
      'ai.redhat.com/featured'?: string;
      'github.com/project-slug'?: string;
      'gitlab.com/instance'?: string;
      'gitlab.com/project-slug'?: string;
      'backstage.io/techdocs-ref'?: string;
      'backstage.io/source-location'?: string;
      [key: string]: string | undefined;
    };
  };
  spec?: {
    owner?: string;
  };
}

// Constantes del repositorio de catálogo
const GITLAB_HOST = 'gitlab.cee.redhat.com';
const CATALOG_REPO = 'jbarea/ai-showcase-test';
const CATALOG_PROJECT_ID = CATALOG_REPO; // No codificar aquí, el backend lo hará
const DEFAULT_BRANCH = 'main';

/**
 * Construye la ruta al archivo YAML del componente en el repositorio de catálogo
 * @param projectName - Nombre del proyecto
 * @returns Ruta al archivo YAML
 */
export function getComponentPath(projectName: string): string {
  return `entities/ai/components/${projectName}/${projectName}.yaml`;
}

/**
 * Obtiene el contenido de un archivo desde GitLab
 * @param projectId - ID del proyecto GitLab (encoded)
 * @param filePath - Ruta del archivo
 * @param ref - Rama o commit ref
 * @param token - GitLab personal access token
 * @returns Contenido del archivo como string
 */
export async function fetchGitLabFile(
  projectId: string,
  filePath: string,
  ref: string,
  token: string,
): Promise<string> {
  const encodedFilePath = encodeURIComponent(filePath);
  const url = `https://${GITLAB_HOST}/api/v4/projects/${projectId}/repository/files/${encodedFilePath}/raw?ref=${encodeURIComponent(ref)}`;

  const headers: HeadersInit = {
    'PRIVATE-TOKEN': token,
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch file from GitLab: ${response.status} ${response.statusText}`,
      );
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching GitLab file:', error);
    throw error;
  }
}

/**
 * Parsea el contenido YAML y extrae los metadatos del proyecto
 */
export function parseProjectYaml(yamlContent: string): {
  title?: string;
  description?: string;
  tags?: string[];
  category?: string;
  usecase?: string;
  owner?: string;
  status?: string;
  domain?: string;
  featured?: boolean;
  repoType?: 'GitHub' | 'GitLab';
  githubUrl?: string;
  gitlabUrl?: string;
  gitlabInstance?: string;
} {
  try {
    const parsed = yaml.load(yamlContent) as ComponentYaml;
    const annotations = parsed.metadata?.annotations;

    // Convert featured string ('true'/'false') to boolean
    const featuredStr = annotations?.['ai.redhat.com/featured'];
    const featured = featuredStr === 'true';

    // Determine repository type and extract URLs
    let repoType: 'GitHub' | 'GitLab' | undefined;
    let githubUrl: string | undefined;
    let gitlabUrl: string | undefined;
    let gitlabInstance: string | undefined;

    const githubSlug = annotations?.['github.com/project-slug'];
    const gitlabSlug = annotations?.['gitlab.com/project-slug'];
    const gitlabInstanceValue = annotations?.['gitlab.com/instance'];
    const sourceLocation = annotations?.['backstage.io/source-location'];

    if (githubSlug) {
      repoType = 'GitHub';
      // Reconstruct GitHub URL from slug
      githubUrl = `https://github.com/${githubSlug}`;
    } else if (gitlabSlug) {
      repoType = 'GitLab';
      gitlabInstance = gitlabInstanceValue;
      // Reconstruct GitLab URL from instance and slug
      const host = gitlabInstanceValue || 'gitlab.com';
      gitlabUrl = `https://${host}/${gitlabSlug}`;
    } else if (sourceLocation) {
      // Fallback: try to detect from source-location
      const urlMatch = sourceLocation.match(/url:(.+)/);
      if (urlMatch) {
        const url = urlMatch[1].trim().replace(/\/$/, '');
        if (url.includes('github.com')) {
          repoType = 'GitHub';
          githubUrl = url;
        } else if (url.includes('gitlab')) {
          repoType = 'GitLab';
          gitlabUrl = url;
          // Extract instance from URL
          const instanceMatch = url.match(/https:\/\/([^/]+)\//);
          if (instanceMatch) {
            gitlabInstance = instanceMatch[1];
          }
        }
      }
    }

    return {
      title: parsed.metadata?.title,
      description: parsed.metadata?.description,
      tags: parsed.metadata?.tags || [],
      category: annotations?.['ai.redhat.com/category'],
      usecase: annotations?.['ai.redhat.com/usecase'],
      owner: annotations?.['ai.redhat.com/owner'],
      status: annotations?.['ai.redhat.com/status'],
      domain: annotations?.['ai.redhat.com/domain'],
      featured,
      repoType,
      githubUrl,
      gitlabUrl,
      gitlabInstance,
    };
  } catch (error) {
    console.error('Error parsing YAML:', error);
    return {};
  }
}

/**
 * Prepara los datos para editar un proyecto leyendo su configuración actual desde main
 * @param entity - Entidad de Backstage del proyecto
 * @param gitlabApiClient - GitLab API client
 * @returns Datos preparados para la edición o null si hay error
 */
export async function prepareProjectEditData(
  entity: Entity,
  gitlabApiClient: GitLabApiClient,
): Promise<ProjectEditData | null> {
  const projectName = entity.metadata.name;

  try {
    // 1. Construir la ruta al archivo YAML del componente
    const componentPath = getComponentPath(projectName);

    console.log(`Reading configuration for project: ${projectName}`);
    console.log(`File path: ${componentPath}`);

    // 2. Obtener el contenido actual del YAML desde la rama main usando el backend
    const yamlContent = await gitlabApiClient.fetchFile({
      projectId: CATALOG_PROJECT_ID,
      filePath: componentPath,
      ref: DEFAULT_BRANCH,
    });

    // 3. Parsear el YAML para extraer los valores actuales
    const parsed = parseProjectYaml(yamlContent);

    console.log('Parsed YAML:', parsed);

    return {
      projectId: CATALOG_PROJECT_ID,
      componentPath,
      projectName,
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
      category: parsed.category,
      usecase: parsed.usecase,
      owner: parsed.owner,
      status: parsed.status,
      domain: parsed.domain,
      featured: parsed.featured,
      repoType: parsed.repoType,
      githubUrl: parsed.githubUrl,
      gitlabUrl: parsed.gitlabUrl,
      gitlabInstance: parsed.gitlabInstance,
    };
  } catch (error) {
    console.error('Error preparing project edit data:', error);
    return null;
  }
}
