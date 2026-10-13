/** @type {import('jest').Config} */
module.exports = {
  rootDir: '..',
  testEnvironment: 'node',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.spec.json' }] },
  moduleFileExtensions: ['ts', 'js', 'json'],
  // Generated Prisma client uses .js suffixes on relative TS imports.
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
};
