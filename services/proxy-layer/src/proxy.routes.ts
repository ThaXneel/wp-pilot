import { Router } from 'express';
import type { Request, Response } from 'express';
import { ProxyService } from './proxy.service.js';
import jwt from 'jsonwebtoken';

const router = Router();
const proxyService = new ProxyService();

/**
 * Middleware: verify the incoming request is from our backend
 */
function verifyBackendToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'dev-secret';
    jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

router.use(verifyBackendToken);

// Products
router.get('/sites/:siteId/products', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'GET', '/products', req.query);
  res.status(result.status).json(result.data);
});

router.post('/sites/:siteId/products', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'POST', '/products', undefined, req.body);
  res.status(result.status).json(result.data);
});

router.put('/sites/:siteId/products/:productId', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'PUT', `/products/${req.params.productId}`, undefined, req.body);
  res.status(result.status).json(result.data);
});

router.get('/sites/:siteId/products/count', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'GET', '/products/count');
  res.status(result.status).json(result.data);
});

// Orders
router.get('/sites/:siteId/orders', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'GET', '/orders', req.query);
  res.status(result.status).json(result.data);
});

router.get('/sites/:siteId/orders/count', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'GET', '/orders/count');
  res.status(result.status).json(result.data);
});

// Posts
router.get('/sites/:siteId/posts', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'GET', '/posts', req.query);
  res.status(result.status).json(result.data);
});

router.post('/sites/:siteId/posts', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'POST', '/posts', undefined, req.body);
  res.status(result.status).json(result.data);
});

router.put('/sites/:siteId/posts/:postId', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'PUT', `/posts/${req.params.postId}`, undefined, req.body);
  res.status(result.status).json(result.data);
});

router.get('/sites/:siteId/posts/count', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'GET', '/posts/count');
  res.status(result.status).json(result.data);
});

// Health
router.get('/sites/:siteId/health', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'GET', '/health');
  res.status(result.status).json(result.data);
});

// Handshake
router.post('/sites/:siteId/handshake', async (req: Request, res: Response) => {
  const result = await proxyService.forward(req.params.siteId as string, 'POST', '/handshake');
  res.status(result.status).json(result.data);
});

export { router as proxyRoutes };
