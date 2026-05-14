import { defineConfig } from 'orval';

const baseUrl = "localhost:8080";

export default defineConfig({
  genai: {
    input: '../api/genAI.yaml',
    output: {
      client: 'fetch',
      baseUrl,
      target: 'src/api/genai.ts',
    },
  },
  auth: {
    input: '../api/auth.yaml',
    output: './src/api/auth.ts'
  },
});
