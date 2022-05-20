import { defaults } from 'jest-config';

/** @type {import('ts-jest').InitialOptionsTsJest} */
export default {
  testMatch: ['<rootDir>/**/*.spec.(ts|tsx)'],
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig-esm.json',
    },
  },
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '.+\\.(svg|css|style|less|sass|scss|png|jpg|ttf|woff|woff2)$': '<rootDir>/_test/jest/mocks/file-transformer.js',
  },
  reporters: ['default', ['jest-junit', { outputDirectory: '_test/jest/test-results', outputName: 'jest.xml' }]],
};
