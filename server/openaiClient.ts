// openaiClient.ts
// openaiClient.ts
import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({ apiKey });

export default openai;
