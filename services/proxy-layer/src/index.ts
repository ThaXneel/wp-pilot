import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { proxyRoutes } from './proxy.routes.js';

const app = express();
const PORT = process.env.PROXY_PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.BACKEND_URL || 'http://localhost:3001',
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'proxy-layer', timestamp: new Date().toISOString() });
});

// Proxy routes
app.use('/proxy', proxyRoutes);

app.listen(PORT, () => {
  console.log(`[Proxy Layer] running on port ${PORT}`);
});

export default app;
