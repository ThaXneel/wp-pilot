import { CacheService } from './cache.service.js';
import { normalize } from './normalizer.js';

interface SiteConfig {
  wpUrl: string;
  apiToken: string;
}

interface ProxyResult {
  status: number;
  data: unknown;
}

export class ProxyService {
  private cache: CacheService;

  constructor() {
    this.cache = new CacheService();
  }

  /**
   * Forward a request to a WordPress site's connector plugin.
   */
  async forward(
    siteId: string,
    method: string,
    path: string,
    query?: Record<string, unknown>,
    body?: unknown,
  ): Promise<ProxyResult> {
    try {
      const site = await this.getSiteConfig(siteId);
      if (!site) {
        return { status: 404, data: { error: 'Site not found or not configured' } };
      }

      // Check cache for GET requests
      if (method === 'GET') {
        const cacheKey = `proxy:${siteId}:${path}:${JSON.stringify(query || {})}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return { status: 200, data: JSON.parse(cached) };
        }
      }

      // Build the request URL
      const url = new URL(`/wp-json/saas-connector/v1${path}`, site.wpUrl);
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
      }

      // Make the request to the WordPress site
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${site.apiToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      // Guard against non-JSON responses (e.g. HTML error pages from WP)
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`[Proxy] Non-JSON response from site ${siteId}: status=${response.status}, body=${text.slice(0, 200)}`);
        return {
          status: 502,
          data: { error: 'WordPress site returned a non-JSON response. Ensure the WP Pilot Connector plugin is active and permalinks are configured.' },
        };
      }

      const responseData = await response.json();
      const normalized = normalize(responseData);

      // Cache successful GET responses for 60 seconds
      if (method === 'GET' && response.ok) {
        const cacheKey = `proxy:${siteId}:${path}:${JSON.stringify(query || {})}`;
        await this.cache.set(cacheKey, JSON.stringify(normalized), 60);
      }

      // Invalidate cache on write operations
      if (method !== 'GET' && response.ok) {
        const resource = path.split('/')[1]; // e.g., 'products', 'posts'
        if (resource) {
          await this.cache.invalidatePattern(`proxy:${siteId}:/${resource}*`);
        }
      }

      return { status: response.status, data: normalized };
    } catch (error) {
      console.error(`[Proxy] Error forwarding to site ${siteId}:`, error);
      return { status: 502, data: { error: 'Failed to reach WordPress site' } };
    }
  }

  /**
   * Retrieve site connection config from the backend database.
   * In production, this would query the backend API or a shared DB.
   */
  private async getSiteConfig(siteId: string): Promise<SiteConfig | null> {
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/sites/${siteId}/config`, {
        headers: {
          'X-Internal-Service': 'proxy-layer',
        },
      });

      if (!response.ok) return null;

      const data = await response.json() as { wpUrl: string; apiToken: string };
      return { wpUrl: data.wpUrl, apiToken: data.apiToken };
    } catch {
      return null;
    }
  }
}
