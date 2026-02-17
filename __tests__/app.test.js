const request = require('supertest');
const app = require('../server'); // make sure server exports app

describe('Basic test', () => {
  it('should return 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });
});
