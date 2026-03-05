import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { proxyRoutes } from './proxy.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.BACKEND_URL || 'http://localhost:5000',
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'proxy-layer', timestamp: new Date().toISOString() });
});

// Proxy routes
app.use('/proxy', proxyRoutes);

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Proxy] Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal proxy error' });
});

app.listen(PORT, () => {
  console.log(`[Proxy Layer] running on port ${PORT}`);
});

export default app;
