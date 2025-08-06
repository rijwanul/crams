// Sample unit test for login logic (Jest style)
const request = require('supertest');
const app = require('../server');

describe('POST /api/auth/login', () => {
  it('should fail with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });
});
