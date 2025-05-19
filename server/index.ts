import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import storyRoutes from './storyRoutes';

dotenv.config();

const app = express();
const port: number = Number(process.env.PORT) || 3001;

app.use(cors());

app.use(express.json());

// Optional: CORS test endpoint
app.get('/cors-test', (_req, res) => {
  res.json({ success: true, message: 'CORS is working!' });
});

// Register story and image generation routes
app.use('/api', storyRoutes);

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    message: 'health route (openai temporarily disabled)',
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
