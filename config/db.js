/**
 * ============================================================================
 * MongoDB Connection Configuration
 * ============================================================================
 * Establishes connection to MongoDB database (Local or MongoDB Atlas)
 * using Mongoose ODM with reconnect handling and graceful degradation.
 */

import mongoose from 'mongoose';

export const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/credit_score_db';

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000 // 5s timeout
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        return { isConnected: true, host: conn.connection.host, database: conn.connection.name };
    } catch (error) {
        console.warn(`⚠️ MongoDB Connection Notice: ${error.message}`);
        console.warn('ℹ️ Running in hybrid mode: LocalStorage fallback will be active if MongoDB is offline.');
        return { isConnected: false, error: error.message };
    }
};

export const isDBConnected = () => {
    return mongoose.connection.readyState === 1;
};
