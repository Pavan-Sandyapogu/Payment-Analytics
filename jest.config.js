module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  clearMocks: true,       // Implicitly clear mocks between independent executions
  testTimeout: 10000      // Grant higher memory server loading boundaries
};
