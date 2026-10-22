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
        // Ne mettez PAS process.exit(1) ici pour l'instant, 
        // cela permettra au serveur de rester allumé pour tester le frontend !
    }
}

module.exports = connectDB;