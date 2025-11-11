const request = require('supertest');
const app = require('../src/app');

describe('Delivery API', () => {
  it('should create a delivery', async () => {
    const res = await request(app)
      .post('/api/deliveries')
      .send({
        items: [{ itemId: 1, quantity: 2 }],
        customerName: 'Test User',
        customerPhone: '9999999999',
        address: { address1: '123 Main St' }
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.deliveryId).toBeDefined();
  });

  it('should list deliveries', async () => {
    const res = await request(app).get('/api/deliveries');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
