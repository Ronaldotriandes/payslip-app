import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';
});

afterAll(() => {
    // Cleanup after all tests
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