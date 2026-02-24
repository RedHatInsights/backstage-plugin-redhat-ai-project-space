import { getAnnotation, isFeatured, searchFunction } from './utils';
import { Entity } from '@backstage/catalog-model';

describe('utils', () => {
  describe('getAnnotation', () => {
    it('should return the annotation value when present', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            'ai.redhat.com/category': 'ML',
          },
        },
      };

      expect(getAnnotation(entity, 'category')).toBe('ML');
    });

    it('should return dash when annotation is not present', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
        },
      };

      expect(getAnnotation(entity, 'category')).toBe('-');
    });

    it('should return dash when annotations object is empty', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {},
        },
      };

      expect(getAnnotation(entity, 'category')).toBe('-');
    });

    it('should handle velocity annotation when present', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            'ai.redhat.com/velocity': 'VEL-12345',
          },
        },
      };

      expect(getAnnotation(entity, 'velocity')).toBe('VEL-12345');
    });

    it('should return dash when velocity annotation is not present', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            'ai.redhat.com/category': 'ML',
          },
        },
      };

      expect(getAnnotation(entity, 'velocity')).toBe('-');
    });

    it('should handle multiple annotations including optional velocity', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            'ai.redhat.com/category': 'ML',
            'ai.redhat.com/use-case': 'NLP',
            'ai.redhat.com/velocity': 'VELOCITY-789',
            'ai.redhat.com/owner': 'Team A',
          },
        },
      };

      expect(getAnnotation(entity, 'category')).toBe('ML');
      expect(getAnnotation(entity, 'use-case')).toBe('NLP');
      expect(getAnnotation(entity, 'velocity')).toBe('VELOCITY-789');
      expect(getAnnotation(entity, 'owner')).toBe('Team A');
    });

    it('should handle empty string velocity annotation', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            'ai.redhat.com/velocity': '',
          },
        },
      };

      // Empty string is falsy, so getAnnotation returns the default '-'
      expect(getAnnotation(entity, 'velocity')).toBe('-');
    });
  });

  describe('isFeatured', () => {
    it('should return true when featured annotation is "true"', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            'ai.redhat.com/featured': 'true',
          },
        },
      };

      expect(isFeatured(entity)).toBe(true);
    });

    it('should return false when featured annotation is not "true"', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          annotations: {
            'ai.redhat.com/featured': 'false',
          },
        },
      };

      expect(isFeatured(entity)).toBe(false);
    });

    it('should return false when featured annotation is not present', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
        },
      };

      expect(isFeatured(entity)).toBe(false);
    });
  });

  describe('searchFunction', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-project',
        title: 'Test Project',
        description: 'A test project for AI',
        annotations: {
          'ai.redhat.com/category': 'ML',
          'ai.redhat.com/velocity': 'VEL-12345',
        },
        tags: ['machine-learning', 'ai'],
      },
    };

    it('should return true when search term is empty', () => {
      expect(searchFunction(entity, '')).toBe(true);
    });

    it('should find matches in entity name', () => {
      expect(searchFunction(entity, 'test-project')).toBe(true);
    });

    it('should find matches in entity title', () => {
      expect(searchFunction(entity, 'Test Project')).toBe(true);
    });

    it('should find matches in entity description', () => {
      expect(searchFunction(entity, 'AI')).toBe(true);
    });

    it('should find matches in annotations', () => {
      expect(searchFunction(entity, 'ML')).toBe(true);
    });

    it('should find matches in velocity annotation', () => {
      expect(searchFunction(entity, 'VEL-12345')).toBe(true);
      expect(searchFunction(entity, 'vel-12345')).toBe(true); // case insensitive
    });

    it('should find matches in tags', () => {
      expect(searchFunction(entity, 'machine-learning')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(searchFunction(entity, 'TEST')).toBe(true);
      expect(searchFunction(entity, 'test')).toBe(true);
      expect(searchFunction(entity, 'TeSt')).toBe(true);
    });

    it('should return false when no match is found', () => {
      expect(searchFunction(entity, 'nonexistent')).toBe(false);
    });
  });
});
