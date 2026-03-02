import { describe, it, expect, beforeAll } from 'vitest';

describe('Alternatives API', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  it('should return approved alternatives', async () => {
    const res = await fetch(`${BASE_URL}/api/alternatives`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    // All returned items should be approved
    data.forEach((item: any) => {
      expect(item.status).toBe('approved');
    });
  });

  it('should filter by category', async () => {
    const res = await fetch(`${BASE_URL}/api/alternatives?category=LLM`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('Crawler API', () => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  it('should return crawler status', async () => {
    const res = await fetch(`${BASE_URL}/api/crawler/status`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty('sources');
    expect(data).toHaveProperty('stats');
  });

  it('should have sources endpoint', async () => {
    const res = await fetch(`${BASE_URL}/api/crawler/sources`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty('sources');
  });
});
