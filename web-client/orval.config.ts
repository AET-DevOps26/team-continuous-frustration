import { defineConfig } from 'orval';

export default defineConfig({
  /*
  genaiStream: {
    input: '../api/genAI.json',
    output: {
      client: 'fetch',
      target: 'src/api/genaiStream.ts',
    },
  },
  */
  genai: {
    input: '../api/genAI.json',
    output: './src/api/genai.ts'
  },
  upload: {
    input: '../api/upload.json',
    output: './src/api/upload.ts'
  },
  auth: {
    input: '../api/auth.yaml',
    output: './src/api/auth.ts'
  },
  flashcard: {
    input: '../api/flashcard.yaml',
    output: './src/api/flashcard.ts'
  },
  study: {
    input: '../api/study.yaml',
    output: './src/api/study.ts'
  },
});
