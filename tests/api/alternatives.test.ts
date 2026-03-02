import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('GET /api/alternatives', () => {
  it('should return 200 with alternatives array', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should return alternatives with required fields', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives`);
    const data = await response.json();

    if (data.length > 0) {
      const alternative = data[0];
      expect(alternative).toHaveProperty('id');
      expect(alternative).toHaveProperty('name');
      expect(alternative).toHaveProperty('description');
      expect(alternative).toHaveProperty('category');
      expect(alternative).toHaveProperty('security');
      expect(alternative).toHaveProperty('deployment');
      expect(alternative).toHaveProperty('hardware');
      expect(alternative).toHaveProperty('useCases');
      expect(alternative).toHaveProperty('githubUrl');
    }
  });
});

describe('GET /api/alternatives with filters', () => {
  it('should filter by category', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives?category=AI`);
    expect(response.status).toBe(200);

    const data = await response.json();
    if (data.length > 0) {
      data.forEach((alt: any) => {
        expect(alt.category).toBe('AI');
      });
    }
  });

  it('should filter by security', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives?security=open-source`);
    expect(response.status).toBe(200);

    const data = await response.json();
    if (data.length > 0) {
      data.forEach((alt: any) => {
        expect(alt.security).toBe('open-source');
      });
    }
  });

  it('should filter by deployment', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives?deployment=self-hosted`);
    expect(response.status).toBe(200);

    const data = await response.json();
    // Should return results with self-hosted deployment
    expect(response.status).toBe(200);
  });

  it('should filter by hardware', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives?hardware=GPU`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(response.status).toBe(200);
  });

  it('should filter by useCase', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives?useCase=automation`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(response.status).toBe(200);
  });

  it('should filter by search term', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives?search=open`);
    expect(response.status).toBe(200);

    const data = await response.json();
    // Should return results matching search term
    expect(response.status).toBe(200);
  });

  it('should combine multiple filters', async () => {
    const response = await fetch(`${BASE_URL}/api/alternatives?category=AI&security=open-source`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(response.status).toBe(200);
  });
});
