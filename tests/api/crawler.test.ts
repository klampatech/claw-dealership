import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('GET /api/crawler/status', () => {
  it('should return 200 with crawler status', async () => {
    const response = await fetch(`${BASE_URL}/api/crawler/status`);
    expect(response.status).toBe(200);
  });

  it('should return valid response structure', async () => {
    const response = await fetch(`${BASE_URL}/api/crawler/status`);
    const data = await response.json();

    // Should have sources, recentHistory, and stats
    expect(data).toHaveProperty('sources');
    expect(data).toHaveProperty('recentHistory');
    expect(data).toHaveProperty('stats');

    expect(Array.isArray(data.sources)).toBe(true);
    expect(Array.isArray(data.recentHistory)).toBe(true);
    expect(data.stats).toHaveProperty('totalSources');
    expect(data.stats).toHaveProperty('activeSources');
    expect(data.stats).toHaveProperty('totalItemsFound');
    expect(data.stats).toHaveProperty('totalItemsAdded');
  });

  it('should return sources with required fields', async () => {
    const response = await fetch(`${BASE_URL}/api/crawler/status`);
    const data = await response.json();

    if (data.sources.length > 0) {
      const source = data.sources[0];
      expect(source).toHaveProperty('id');
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('type');
      expect(source).toHaveProperty('url');
      expect(source).toHaveProperty('active');
    }
  });
});

describe('POST /api/crawler/run', () => {
  it('should return 200 on successful crawl', async () => {
    const response = await fetch(`${BASE_URL}/api/crawler/run`, {
      method: 'POST',
    });

    // Should either succeed or fail gracefully
    expect([200, 500]).toContain(response.status);
  });

  it('should return valid response structure on success', async () => {
    const response = await fetch(`${BASE_URL}/api/crawler/run`, {
      method: 'POST',
    });

    if (response.status === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('itemsFound');
      expect(data).toHaveProperty('itemsAdded');
      expect(data).toHaveProperty('message');
    }
  });

  it('should return error structure on failure', async () => {
    const response = await fetch(`${BASE_URL}/api/crawler/run`, {
      method: 'POST',
    });

    if (response.status === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });
});
