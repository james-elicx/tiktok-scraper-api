module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier', 'import'],
  rules: {
    'linebreak-style': ['error', 'unix'],
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],

    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'import/prefer-default-export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
        },
      },
    ],

    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-var-requires': 'error',

    'no-console': 'off',
    'no-plusplus': 'off',
  },
  ignorePatterns: ['*.cjs'],
};
