const request = require('supertest');
const app = require('../server');
const razorpayService = require('../services/razorpayService');

// Sandbox Razorpay integrations completely preventing external HTTP hooks strictly offline
jest.mock('../services/razorpayService', () => {
  const actualModule = jest.requireActual('../services/razorpayService');
  return {
    ...actualModule,
    createOrder: jest.fn().mockResolvedValue({ id: 'mocked_rzp_order_id', amount: 50000, currency: 'INR' }),
    verifyPaymentSignature: jest.fn().mockReturnValue(true) // Implicitly bypass SHA256 hashing specifically
  };
});

describe('E2E Full Transaction & Analytics Pipeline', () => {
  let token;

  const e2eUser = {
    name: 'E2E Validation Agent',
    email: 'e2e@example.com',
    password: 'superpassword123'
  };

  it('should flawlessly pipe: Registration -> JWT Login -> Order Create -> Verify Hook -> Analytics Groupings', async () => {
    // 1. Independent Registration
    const regRes = await request(app).post('/api/auth/register').send(e2eUser);
    expect(regRes.statusCode).toEqual(201);
    token = regRes.body.token;

    // 2. Razorpay Order Generation
    const orderRes = await request(app)
      .post('/api/payments/order')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500, currency: 'INR', receipt: 'receipt_E2E' });
    
    expect(orderRes.statusCode).toEqual(201);
    expect(orderRes.body.order.id).toEqual('mocked_rzp_order_id');

    // 3. Razorpay Signature Sequence & Core Validation Handlers
    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        razorpay_order_id: 'mocked_rzp_order_id',
        razorpay_payment_id: 'mocked_rzp_pay_id',
        razorpay_signature: 'dummy_hash_sig',
        amount: 500,
        category: 'Travel'
      });
    
    expect(verifyRes.statusCode).toEqual(200);
    expect(verifyRes.body.message).toContain('verified successfully');

    // 4. Retrieving Transaction with Express-Query Filters effectively
    const txRes = await request(app)
      .get('/api/transactions?category=Travel')
      .set('Authorization', `Bearer ${token}`);
    
    expect(txRes.statusCode).toEqual(200);
    expect(txRes.body.data.length).toEqual(1);
    expect(txRes.body.data[0].amount).toEqual(500);

    // 5. Finalize Analytics Validation testing dynamic aggregation pipeline execution
    const totalAnalyticsRes = await request(app)
      .get('/api/analytics/total')
      .set('Authorization', `Bearer ${token}`);
    
    expect(totalAnalyticsRes.statusCode).toEqual(200);
    expect(totalAnalyticsRes.body.totalSpending).toEqual(500);

    const categoryRes = await request(app)
      .get('/api/analytics/category')
      .set('Authorization', `Bearer ${token}`);

    expect(categoryRes.statusCode).toEqual(200);
    expect(categoryRes.body.data.find(c => c._id === 'Travel').totalAmount).toEqual(500);
  });
});
