/**
 * Normalizes WordPress/WooCommerce API responses to a consistent format.
 * Strips unnecessary metadata and standardizes field names.
 */
export function normalize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(normalize);
  }

  const record = data as Record<string, unknown>;

  // Remove WordPress internal fields
  const wpInternalFields = ['_links', '_embedded', 'yoast_head', 'yoast_head_json'];
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (wpInternalFields.includes(key)) continue;

    // Convert snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    cleaned[camelKey] = normalize(value);
  }

  return cleaned;
}
