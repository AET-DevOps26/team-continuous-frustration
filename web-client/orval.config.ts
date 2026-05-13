import { defineConfig } from 'orval';

export default defineConfig({
  genai: {
    input: '../api/genAI.yaml',
    output: {
      client: 'fetch',
      target: 'src/api/genai.ts',
    },
  },
});
