const request = require('supertest');
const app = require('../src/server');

describe('API Health Check', () => {
  test('GET /health should return ok status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
