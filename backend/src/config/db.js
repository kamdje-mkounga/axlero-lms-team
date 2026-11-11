const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
    try {
        await mongoose.connect(env.mongoUri, {
            family: 4
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1); // This stops the server from starting if DB fails
    }
}

module.exports = connectDB;