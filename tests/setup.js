const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Statically seed standard explicit environment invariants before importing components globally
process.env.JWT_SECRET = 'secure-jest-isolated-test-secret';
process.env.RAZORPAY_KEY_ID = 'test_rzp_mocked_id';
process.env.RAZORPAY_KEY_SECRET = 'test_rzp_mocked_secret';

let mongoServer;

beforeAll(async () => {
  // Spawn in-memory isolated sandbox preventing live network calls or file polluting
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();  // Rigid state resets between distinct test cycles
  }
});
