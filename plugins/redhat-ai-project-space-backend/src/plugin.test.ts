import { redhatAiProjectSpacePlugin } from './plugin';

describe('redhat-ai-project-space-backend', () => {
  it('should export plugin', () => {
    expect(redhatAiProjectSpacePlugin).toBeDefined();
  });

  it('should be a valid backend plugin', () => {
    expect(typeof redhatAiProjectSpacePlugin).toBe('object');
    expect(redhatAiProjectSpacePlugin).toHaveProperty('$$type');
  });
});
