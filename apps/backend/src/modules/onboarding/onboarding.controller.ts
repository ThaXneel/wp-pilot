import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { onboardingService } from './onboarding.service.js';

export const onboardingController = {
  async downloadPlugin(_req: Request, res: Response, next: NextFunction) {
    try {
      const pluginDir = path.resolve(process.cwd(), '../../wordpress-plugin/wp-pilot-connector');

      if (!fs.existsSync(pluginDir)) {
        res.status(404).json({ success: false, error: 'Plugin files not found' });
        return;
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="wp-pilot-connector.zip"');

      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(res);

      // Add the plugin directory contents inside a wp-pilot-connector/ folder in the zip
      archive.directory(pluginDir, 'wp-pilot-connector');

      await archive.finalize();
    } catch (err) {
      next(err);
    }
  },

  /**
   * Public endpoint called by the WP plugin to complete the handshake.
   * The connect token itself serves as authentication.
   */
  async handshake(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await onboardingService.verify(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await onboardingService.getStatus(req.user!.clientId!);
      res.json({ success: true, data: status });
    } catch (err) {
      next(err);
    }
  },

  async generateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await onboardingService.generateToken(req.user!.clientId!);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Authenticated endpoint for the frontend to check if handshake completed.
   */
  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await onboardingService.getStatus(req.user!.clientId!);
      const verified = status.hasActiveSite;
      res.json({ success: true, data: { verified } });
    } catch (err) {
      next(err);
    }
  },
};
