import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { generateRouter } from './routes/generate.js';
import { handleAuthStatus, handleLogin, handleLogout, requireAuth } from './services/authService.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 3001);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.resolve(__dirname, '../../frontend/dist');

if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: 'http://127.0.0.1:5173', credentials: true }));
}
app.use(express.json({ limit: '50mb' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/auth/status', handleAuthStatus);
app.post('/api/auth/login', handleLogin);
app.post('/api/auth/logout', handleLogout);
app.use('/api', requireAuth, generateRouter);
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on :${port}`);
});
