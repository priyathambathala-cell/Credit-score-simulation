/**
 * ============================================================================
 * Express Server with MongoDB Backend (Vercel & Local Supported)
 * ============================================================================
 * Educational Project: Credit Score Simulation Engine
 * Serves REST APIs for credit scoring, profile synchronization, and MongoDB history.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, isDBConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware for Serverless (Vercel) & Local execution
app.use(async (req, res, next) => {
    if (!isDBConnected() && process.env.MONGODB_URI) {
        try {
            await connectDB();
        } catch (err) {
            console.warn('DB connection attempt in request middleware:', err.message);
        }
    }
    next();
});

// Serve static frontend files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '.')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/profile', profileRoutes);

// Health Check & Database Status Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        name: 'Credit Score Simulation Engine API',
        version: '1.0.0',
        mongoConnected: isDBConnected(),
        mongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//***@') : 'Local default',
        timestamp: new Date().toISOString()
    });
});

// Root Route fallback to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server locally when not running as a Vercel Serverless Function
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`\n==================================================`);
        console.log(`🚀 Credit Score Simulation Engine Server Running`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log(`🗄️  MongoDB: ${isDBConnected() ? 'CONNECTED ✅' : 'OFFLINE (Hybrid Local Mode Active) 🟡'}`);
        console.log(`==================================================\n`);
    });
};

if (!process.env.VERCEL) {
    startServer();
}

export default app;
