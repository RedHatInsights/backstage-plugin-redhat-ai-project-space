import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';
import { Entity } from '@backstage/catalog-model';
import { BrowserRouter } from 'react-router-dom';

// Mock the VoteButtons component
jest.mock('./VoteButtons', () => ({
  VoteButtons: () => <div data-testid="vote-buttons">Vote Buttons</div>,
}));

// Helper function to create a mock entity
const createMockEntity = (velocityId?: string): Entity => {
  const annotations: Record<string, string> = {
    'ai.redhat.com/category': 'Test Category',
    'ai.redhat.com/usecase': 'Test Usecase',
    'ai.redhat.com/status': 'Active',
    'ai.redhat.com/owner': 'Test Owner',
    'ai.redhat.com/domain': 'Internal',
  };

  // Add velocity annotation only if provided
  if (velocityId !== undefined) {
    annotations['ai.redhat.com/velocity'] = velocityId;
  }

  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-project',
      namespace: 'ai',
      title: 'Test Project',
      description: 'This is a test project',
      annotations,
      tags: ['test', 'demo'],
    },
    spec: {
      type: 'service',
      lifecycle: 'production',
      owner: 'team-a',
    },
  };
};

// Wrapper component to provide Router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProjectCard - Velocity ID', () => {
  it('should display velocity id when annotation is present', () => {
    const entity = createMockEntity('VEL-12345');

    renderWithRouter(<ProjectCard entity={entity} />);

    // Check that "Velocity ID" label is present
    expect(screen.getByText('Velocity ID')).toBeInTheDocument();

    // Check that the velocity id value is displayed
    expect(screen.getByText('VEL-12345')).toBeInTheDocument();
  });

  it('should display dash when velocity id annotation is not present', () => {
    const entity = createMockEntity();

    renderWithRouter(<ProjectCard entity={entity} />);

    // Check that "Velocity ID" label is present
    expect(screen.getByText('Velocity ID')).toBeInTheDocument();

    // Check that the default dash is displayed when velocity id is missing
    const metadataItems = screen.getAllByText('-');
    expect(metadataItems.length).toBeGreaterThan(0);
  });

  it('should display dash when velocity id annotation is empty string', () => {
    const entity = createMockEntity('');

    renderWithRouter(<ProjectCard entity={entity} />);

    // Check that "Velocity ID" label is present
    expect(screen.getByText('Velocity ID')).toBeInTheDocument();

    // Check that the default dash is displayed for empty string
    const metadataItems = screen.getAllByText('-');
    expect(metadataItems.length).toBeGreaterThan(0);
  });

  it('should render all metadata fields including velocity id', () => {
    const entity = createMockEntity('VEL-67890');

    renderWithRouter(<ProjectCard entity={entity} />);

    // Verify all metadata labels are present
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Usecase')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Velocity ID')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();

    // Verify velocity id value
    expect(screen.getByText('VEL-67890')).toBeInTheDocument();
  });

  it('should handle various velocity id formats', () => {
    const testCases = [
      'VEL-123',
      'VELOCITY-456',
      '789',
      'custom-velocity-id',
    ];

    testCases.forEach(velocityId => {
      const { unmount } = renderWithRouter(
        <ProjectCard entity={createMockEntity(velocityId)} />
      );

      expect(screen.getByText(velocityId)).toBeInTheDocument();

      // Clean up before next iteration
      unmount();
    });
  });
});
