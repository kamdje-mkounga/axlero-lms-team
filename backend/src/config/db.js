const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
    try {
        await mongoose.connect(env.mongoUri);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

module.exports = connectDB;