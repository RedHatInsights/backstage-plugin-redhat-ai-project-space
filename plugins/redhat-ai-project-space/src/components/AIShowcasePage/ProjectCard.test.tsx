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
    'ai.redhat.com/use-case': 'Test Usecase',
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

describe('ProjectCard - Maturity Levels', () => {
  it('should display maturity chip for graduated projects', () => {
    const entity = createMockEntity('VEL-123');
    entity.metadata.annotations!['ai.redhat.com/maturity'] = 'Graduated';

    const { container } = renderWithRouter(<ProjectCard entity={entity} />);

    expect(screen.getByText('Graduated')).toBeInTheDocument();

    // Check that the card has the graduated background class
    const card = container.querySelector('.MuiCard-root');
    expect(card?.className).toContain('cardGraduated');
  });

  it('should display maturity chip for incubating projects', () => {
    const entity = createMockEntity('VEL-123');
    entity.metadata.annotations!['ai.redhat.com/maturity'] = 'Incubating';

    const { container } = renderWithRouter(<ProjectCard entity={entity} />);

    expect(screen.getByText('Incubating')).toBeInTheDocument();

    // Check that the card has the incubating background class
    const card = container.querySelector('.MuiCard-root');
    expect(card?.className).toContain('cardIncubating');
  });

  it('should display maturity chip for sandbox projects', () => {
    const entity = createMockEntity('VEL-123');
    entity.metadata.annotations!['ai.redhat.com/maturity'] = 'Sandbox';

    const { container } = renderWithRouter(<ProjectCard entity={entity} />);

    expect(screen.getByText('Sandbox')).toBeInTheDocument();

    // Check that the card has the sandbox background class
    const card = container.querySelector('.MuiCard-root');
    expect(card?.className).toContain('cardSandbox');
  });

  it('should not display maturity chip when maturity is not set', () => {
    const entity = createMockEntity('VEL-123');
    // Don't set maturity annotation

    renderWithRouter(<ProjectCard entity={entity} />);

    // Maturity chip should not be rendered (no chip with maturity text)
    expect(screen.queryByText('Graduated')).not.toBeInTheDocument();
    expect(screen.queryByText('Incubating')).not.toBeInTheDocument();
    expect(screen.queryByText('Sandbox')).not.toBeInTheDocument();
  });

  it('should handle case-insensitive maturity values for card background', () => {
    const testCases = ['graduated', 'GRADUATED', 'GrAdUaTeD'];

    testCases.forEach(maturity => {
      const entity = createMockEntity('VEL-123');
      entity.metadata.annotations!['ai.redhat.com/maturity'] = maturity;

      const { container, unmount } = renderWithRouter(<ProjectCard entity={entity} />);

      // Should still apply the graduated background class
      const card = container.querySelector('.MuiCard-root');
      expect(card?.className).toContain('cardGraduated');

      unmount();
    });
  });
});
