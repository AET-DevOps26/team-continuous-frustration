import { defineConfig } from 'orval';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const baseUrl = process.env.VITE_API_BASE_URL ?? '';

export default defineConfig({
  genai: {
    input: '../api/genAI.yaml',
    output: {
      client: 'fetch',
      baseUrl,
      target: 'src/api/genai.ts',
    },
  },
  upload: {
    input: '../api/upload.json',
    output: './src/api/upload.ts'
  },
  auth: {
    input: '../api/auth.yaml',
    output: './src/api/auth.ts'
  },
});
