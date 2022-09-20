import { defaults } from 'jest-config';

/** @type {import('ts-jest').InitialOptionsTsJest} */
export default {
  testMatch: ['<rootDir>/**/*.spec.(ts|tsx)'],
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      // required due to custom location of tsconfig.json configuration file
      // https://kulshekhar.github.io/ts-jest/docs/getting-started/options/tsconfig
      { tsconfig: './tsconfig-esm.json' },
    ],
    '.+\\.(svg|css|style|less|sass|scss|png|jpg|ttf|woff|woff2)$': '<rootDir>/_test/jest/mocks/file-transformer.js',
  },
  reporters: ['default', ['jest-junit', { outputDirectory: '_test/jest/test-results', outputName: 'jest.xml' }]],
};
