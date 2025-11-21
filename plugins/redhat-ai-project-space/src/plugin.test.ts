import { redhatAIProjectSpacePlugin, AIShowcasePageComponent } from './plugin';

describe('redhat-ai-project-space', () => {
  it('should export plugin', () => {
    expect(redhatAIProjectSpacePlugin).toBeDefined();
  });

  it('should have correct plugin id', () => {
    expect(redhatAIProjectSpacePlugin.getId()).toBe('redhat-ai-project-space');
  });
});

describe('AIShowcasePageComponent', () => {
  it('should export AIShowcasePageComponent', () => {
    expect(AIShowcasePageComponent).toBeDefined();
  });
});