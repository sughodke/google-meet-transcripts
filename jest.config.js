
module.exports = {
  // can pass this in via the command line or invoke a separate config for CI/pre-commit
  // but the current time difference is very minor (10s of ms max)
  // npm test -- --collect-coverage
  // but it screws up line numbers
  // collectCoverage: true,
  verbose: true,
  coveragePathIgnorePatterns: ['/node_modules/'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/fixtures/'],
  testMatch: ['**/tests/**/*.js'],
  moduleFileExtensions: [ 'js', 'json', 'jsx', 'node', 'ts', 'tsx' ],
  // this is set on the command line
  // reporters: ['default', 'jest-junit'],
  // testEnvironment: './test-environment.js',
  // globalSetup: './global-setup.js',
};

//
// Notes on configuring test files to import from either `lib` or `build`
//
// Motivation: to be able to test against TypeScript and compiled TypeScript
// so that code coverage stats align with actual lines of code and so that
// the delta between the test process and actual usage is minimized
//
// Objectives:
//  - minimize changes between development and build configs
//  - minimize side-effects of configuration options
//
// v1 - the build config just overrides `rootDir` to `./build`, but changing the 
//  rootDir had unintended consequences for the coverageDirectory and may also 
//  surface later if other files like testEnvironment and globalSetup ever become 
//  important.
//
//  rootDir: './lib',
//  coverageDirectory: '../coverage',
//  roots: ['<rootDir>', '<rootDir>/../tests'],
//  moduleNameMapper: {
//    '^\/lib/(.*)': '<rootDir>/$1',
//  },
//
// v2 - the build config just overrides the moduleNameMapper, but I consider that
//  non-trivial because it's a regex. There should be no side effects.
//
//  // this isn't actually required
//  // roots: ['<rootDir>/lib', '<rootDir>/tests'],
//  moduleNameMapper: {
//    '^\/lib/(.*)': '<rootDir>/lib/$1',
//  },
//
// v3 - the build config just overrides `modulePaths`, which I consider to be a lesser
//  change than the regex in v2. However, the scope of modulePaths is unclear. The scope
//  may be acceptable as test-environment.js and global-setup.js were both unaffeced.
//
//  modulePaths: ['<rootDir>/lib'],
//  moduleNameMapper: {
//    '^\/lib/(.*)': '$1',
//  },
//
