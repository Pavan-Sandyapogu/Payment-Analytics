const mongoose = require('mongoose');

// DB configuration entry point
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            return console.warn('MONGO_URI is undefined! Skipping local database connection entirely.');
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to DB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
