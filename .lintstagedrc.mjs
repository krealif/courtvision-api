export default {
  '**/*.ts': () => 'tsc --noEmit',
  '**/*.{ts,js,mjs}': ['eslint --fix', 'prettier --write'],
  '**/*.{json,md}': 'prettier --write',
};
