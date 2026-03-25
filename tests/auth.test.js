const request = require('supertest');
const app = require('../server');
const User = require('../models/userModel');

describe('Authentication Flow - Independent Validation', () => {
  const validUser = {
    name: 'Test Auth User',
    email: 'testauth@example.com',
    password: 'password123'
  };

  it('Feature 1: Should securely register a new distinct user gracefully', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    
    // Validate Mongo insertion distinctly
    const userInDb = await User.findOne({ email: validUser.email });
    expect(userInDb).not.toBeNull();
  });

  it('Feature 2: Should effectively authenticate the strictly registered test user', async () => {
    // Seed DB
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email,
      password: validUser.password
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('Feature 3: Should rigidly intercept invalid express-validator constraints silently', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: ' ',
      email: 'not-an-email-format',
      password: 'short'
    });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
});
