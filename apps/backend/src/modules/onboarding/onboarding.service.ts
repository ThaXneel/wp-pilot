import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { VerifyHandshakeInput } from './onboarding.validation.js';

export const onboardingService = {
  async getStatus(clientId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { sites: true, connectTokens: { where: { used: false } } },
    });

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const hasSite = client.sites.length > 0;
    const hasActiveSite = client.sites.some((s: { status: string }) => s.status === 'ONLINE');
    const pendingToken = client.connectTokens[0];

    return {
      step: hasActiveSite ? 4 : hasSite ? 3 : pendingToken ? 2 : 1,
      hasSite,
      hasActiveSite,
      pendingToken: pendingToken?.token ?? null,
      clientStatus: client.status,
    };
  },

  async generateToken(clientId: string) {
    // Invalidate existing unused tokens
    await prisma.connectToken.updateMany({
      where: { clientId, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const connectToken = await prisma.connectToken.create({
      data: { clientId, token, expiresAt },
    });

    return { token: connectToken.token, expiresAt: connectToken.expiresAt };
  },

  async verify(input: VerifyHandshakeInput) {
    const connectToken = await prisma.connectToken.findUnique({
      where: { token: input.token },
      include: { client: true },
    });

    if (!connectToken || connectToken.used || connectToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired connect token', 400);
    }

    const apiToken = crypto.randomBytes(48).toString('hex');

    // Derive a display name: use provided siteName, or extract hostname from wpUrl
    let siteName = input.siteName;
    if (!siteName) {
      try {
        siteName = new URL(input.wpUrl).hostname;
      } catch {
        siteName = input.wpUrl;
      }
    }

    // Normalise the WordPress URL for comparison (strip trailing slash)
    const normalisedUrl = input.wpUrl.replace(/\/+$/, '');

    // Check if a site with the same wpUrl already exists for this client (re-handshake)
    const existingSite = await prisma.clientSite.findFirst({
      where: {
        clientId: connectToken.clientId,
        wpUrl: { in: [normalisedUrl, normalisedUrl + '/'] },
      },
    });

    let site;
    if (existingSite) {
      // Re-handshake: rotate the API token and refresh metadata
      site = await prisma.clientSite.update({
        where: { id: existingSite.id },
        data: {
          name: siteName,
          apiToken,
          status: 'ONLINE',
          wpVersion: input.wpVersion,
          wpUrl: normalisedUrl,
          lastPing: new Date(),
          errorCount: 0,
          healthScore: 100,
        },
      });
    } else {
      // First connection for this WordPress URL
      site = await prisma.clientSite.create({
        data: {
          clientId: connectToken.clientId,
          name: siteName,
          wpUrl: normalisedUrl,
          apiToken,
          status: 'ONLINE',
          wpVersion: input.wpVersion,
          lastPing: new Date(),
        },
      });
    }

    await prisma.$transaction([
      prisma.connectToken.update({
        where: { id: connectToken.id },
        data: { used: true },
      }),
      prisma.client.update({
        where: { id: connectToken.clientId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    return {
      siteId: site.id,
      apiToken,
      status: site.status,
    };
  },
};
