import { defineConfig } from 'orval';

export default defineConfig({
  gateway: {
    input: '../api/openapi.yaml',
    output: './src/api/gateway.ts'
  },
});
