import express, { Request, Response } from 'express';
import path from 'path';
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

// --- Serve static files from the React app ---
// Path assumes server/dist/index.js is the running file and client/dist/ is the client build output
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// --- The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file. ---
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});
// --- End of frontend serving configuration ---

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
