// Author: A097MPRUS.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', '.astro/', 'public/', 'src/**/*.astro'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        self: 'readonly',
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        localStorage: 'readonly',
        matchMedia: 'readonly',
      },
    },
    rules: {
      'no-restricted-properties': [
        'error',
        {
          property: 'innerHTML',
          message: 'Build DOM nodes with textContent; file content is untrusted.',
        },
        {
          property: 'outerHTML',
          message: 'Build DOM nodes with textContent; file content is untrusted.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'Untrusted content must not become HTML.',
        },
        { selector: "CallExpression[callee.name='eval']", message: 'No eval.' },
      ],
    },
  },
);
