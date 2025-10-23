import { Entity } from '@backstage/catalog-model';
import { UsefulLink } from './types';

export const getAnnotation = (entity: Entity, key: string): string => {
  const annotationKey = `ai.redhat.com/${key}`;
  const value = entity.metadata.annotations?.[annotationKey];
  return value || '-';
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

