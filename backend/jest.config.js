/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
    },
    collectCoverageFrom: [
        'src/services/**/*.ts',
        'src/repositories/**/*.ts',
        '!src/**/*.d.ts',
    ],
    coverageDirectory: 'coverage',
};

module.exports = config;
