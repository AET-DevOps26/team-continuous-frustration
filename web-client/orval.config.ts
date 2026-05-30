import { defineConfig } from 'orval';

export default defineConfig({
  genai: {
    input: '../api/genAI.yaml',
    output: {
      client: 'fetch',
      target: 'src/api/genai.ts',
    },
  },
  auth: {
    input: '../api/auth.yaml',
    output: './src/api/auth.ts'
  },
});
