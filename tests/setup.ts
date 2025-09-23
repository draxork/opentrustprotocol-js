/**
 * Jest setup file for OpenTrust Protocol JavaScript SDK tests
 */

// Global test setup
beforeAll(() => {
  // Set timezone for consistent timestamp testing
  process.env.TZ = 'UTC';
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Test utilities
export const createMockJudgment = (T: number, I: number, F: number, sourceId = 'test') => {
  return {
    T,
    I,
    F,
    provenance_chain: [
      {
        source_id: sourceId,
        timestamp: '2025-09-20T20:30:00Z',
        description: `Test judgment: T=${T}, I=${I}, F=${F}`
      }
    ]
  };
};


