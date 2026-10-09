/**
 * ============================================================================
 * Auth Routes - Express API for MongoDB
 * ============================================================================
 */

import express from 'express';
import User from '../models/User.js';
import { isDBConnected } from '../config/db.js';

const router = express.Router();

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        if (!isDBConnected()) {
            return res.json({
                success: true,
                message: 'MongoDB offline; registered in local memory mode',
                user: { id: 'local_' + Date.now(), fullName, email, role: '2nd Year B.Tech' }
            });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        const newUser = await User.create({
            fullName,
            email: email.toLowerCase(),
            password, // Educational demonstration
            role: '2nd Year B.Tech Student'
        });

        res.status(201).json({
            success: true,
            message: 'User registered in MongoDB successfully',
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Login user
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        if (!isDBConnected()) {
            return res.json({
                success: true,
                message: 'MongoDB offline; session active in local memory mode',
                user: { fullName: 'Demo Student', email, role: '2nd Year B.Tech' }
            });
        }

        const user = await User.findOne({ email: email.toLowerCase(), password });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        res.json({
            success: true,
            message: 'Logged in successfully via MongoDB',
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Get or Seed Demo User
 * POST /api/auth/demo
 */
router.post('/demo', async (req, res) => {
    try {
        const demoData = {
            fullName: 'Priyatham kumar',
            email: 'demo@college.edu',
            password: 'password123',
            role: '2nd Year B.Tech Student'
        };

        if (isDBConnected()) {
            let user = await User.findOne({ email: demoData.email });
            if (!user) {
                user = await User.create(demoData);
            }
            return res.json({ success: true, user });
        }

        res.json({ success: true, user: demoData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Update student profile details
 * POST /api/auth/update
 */
router.post('/update', async (req, res) => {
    try {
        const { currentEmail, fullName, email, role, password } = req.body;

        if (!fullName || !email) {
            return res.status(400).json({ success: false, message: 'Name and email are required' });
        }

        const targetEmail = (currentEmail || email).toLowerCase().trim();

        if (isDBConnected()) {
            const updateFields = {
                fullName: fullName.trim(),
                email: email.toLowerCase().trim(),
                role: role || '2nd Year B.Tech Student'
            };
            if (password && password.trim().length >= 6) {
                updateFields.password = password.trim();
            }

            const updatedUser = await User.findOneAndUpdate(
                { email: targetEmail },
                updateFields,
                { new: true, upsert: true }
            );

            return res.json({
                success: true,
                message: 'Profile updated in MongoDB successfully',
                user: updatedUser
            });
        }

        res.json({
            success: true,
            message: 'Profile updated in local mode',
            user: { fullName, email, role: role || '2nd Year B.Tech Student' }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
