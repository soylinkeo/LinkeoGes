import globals from 'globals';
export default [
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  { files: ['src/**/*.{js,jsx}', 'tests/**/*.js', 'scripts/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-duplicate-case': 'error', 'no-dupe-keys': 'error' },
  },
];
