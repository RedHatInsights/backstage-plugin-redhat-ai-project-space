import { Entity } from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/catalog-client';
import { UsefulLink } from './types';

export const getAnnotation = (entity: Entity, key: string): string => {
  const annotationKey = `ai.redhat.com/${key}`;
  const value = entity.metadata.annotations?.[annotationKey];
  return value || '-';
};

/**
 * Fetches all Component entities from the 'ai' namespace and converts them to prose descriptions
 * @param catalogApi - The Backstage Catalog API instance
 * @returns Array of prose descriptions for each AI project
 */
export const buildAIProjectContext = async (catalogApi: CatalogApi): Promise<string[]> => {
  try {
    // Fetch all Component entities from the 'ai' namespace
    const { items: entities } = await catalogApi.getEntities({
      filter: {
        kind: 'Component',
        'metadata.namespace': 'ai',
      },
    });

    // Convert each entity to a prose description
    const proseDescriptions = entities.map(entity => {
      const title = entity.metadata.title || entity.metadata.name;
      const description = entity.metadata.description || 'No description available';
      const tags = entity.metadata.tags?.join(', ') || 'none';
      const category = getAnnotation(entity, 'category');
      const usecase = getAnnotation(entity, 'usecase');
      const owner = getAnnotation(entity, 'owner');
      const domain = getAnnotation(entity, 'domain');
      const status = getAnnotation(entity, 'status');
      
      // Extract source location from annotations
      const sourceLocation = entity.metadata.annotations?.['backstage.io/source-location'] || 
                           entity.metadata.annotations?.['github.com/project-slug'] || 
                           'Source location not specified';
      
      // Clean up source location URL if it has the 'url:' prefix
      const cleanSourceLocation = sourceLocation.startsWith('url:') 
        ? sourceLocation.substring(4) 
        : sourceLocation;

      // Build prose description
      return `${title} is ${description}. It has project tags of ${tags}. It is a ${category} category tool with a ${usecase} use case, owned by ${owner}. It is an ${domain} tool, and ${status}, and its source code location is ${cleanSourceLocation}.`;
    });

    return proseDescriptions;
  } catch (error) {
    console.error('Error fetching AI project context:', error);
    return [];
  }
};

// Custom search function that searches across all entity fields
export const searchFunction = (entity: Entity, searchTerm: string): boolean => {
  if (!searchTerm) return true;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  // Helper function to recursively search through an object
  const searchInObject = (obj: any): boolean => {
    if (obj === null || obj === undefined) return false;
    
    if (typeof obj === 'string') {
      return obj.toLowerCase().includes(lowerSearchTerm);
    }
    
    if (Array.isArray(obj)) {
      return obj.some(item => searchInObject(item));
    }
    
    if (typeof obj === 'object') {
      return Object.values(obj).some(value => searchInObject(value));
    }
    
    return false;
  };
  
  return searchInObject(entity);
};

export const usefulLinks: UsefulLink[] = [
  {
    title: 'Artificial Intelligence Skills Academy',
    url: 'https://source.redhat.com/career/start_learning/skills/artificial_intelligence',
  },
  {
    title: 'Approved AI Tools',
    url: 'https://source.redhat.com/projects_and_programs/ai/ai_tools_and_use_cases',
  },
  {
    title: 'Internal AI News Room',
    url: 'https://source.redhat.com/projects_and_programs/ai/newsroom',
  },
  {
    title: 'Sharing AI Community Blog',
    url: 'https://source.redhat.com/projects_and_programs/ai/share_ai',
  },
  {
    title: 'OpenShift AI',
    url: 'https://www.redhat.com/en/products/ai/openshift-ai',
  },
  {
    title: 'RHEL AI',
    url: 'https://www.redhat.com/en/products/ai/enterprise-linux-ai',
  },
  {
    title: 'Ansible Lightspeed',
    url: 'https://www.redhat.com/en/technologies/management/ansible/ansible-lightspeed',
  },
];

