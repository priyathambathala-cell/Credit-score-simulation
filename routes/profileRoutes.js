/**
 * ============================================================================
 * Profile Routes - Express API for MongoDB
 * ============================================================================
 */

import express from 'express';
import Profile from '../models/Profile.js';
import { evaluateCreditProfile, DEMO_FINANCIAL_PROFILE } from '../js/scoring-engine.js';
import { isDBConnected } from '../config/db.js';

const router = express.Router();

/**
 * Get current active profile
 * GET /api/profile
 */
router.get('/', async (req, res) => {
    try {
        const email = req.query.email || 'demo@college.edu';

        if (!isDBConnected()) {
            return res.json({ success: true, isMongo: false, profile: null });
        }

        let profile = await Profile.findOne({ userEmail: email });
        if (!profile) {
            const demoResult = evaluateCreditProfile(DEMO_FINANCIAL_PROFILE);
            profile = await Profile.create({
                userEmail: email,
                inputs: demoResult.inputs,
                scores: demoResult.scores,
                rating: demoResult.rating,
                breakdown: demoResult.breakdown,
                source: 'Baseline Demo Seed'
            });
        }

        res.json({ success: true, isMongo: true, profile });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Save / Update active profile
 * POST /api/profile
 */
router.post('/', async (req, res) => {
    try {
        const { profileData, email } = req.body;
        const userEmail = email || 'demo@college.edu';

        if (!isDBConnected()) {
            return res.json({ success: true, isMongo: false, message: 'Saved in local mode' });
        }

        const updated = await Profile.findOneAndUpdate(
            { userEmail },
            {
                inputs: profileData.inputs,
                scores: profileData.scores,
                rating: profileData.rating,
                breakdown: profileData.breakdown,
                source: profileData.source || 'User Calculation'
            },
            { new: true, upsert: true }
        );

        res.json({ success: true, isMongo: true, profile: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Reset to Baseline Demo Profile
 * POST /api/profile/reset
 */
router.post('/reset', async (req, res) => {
    try {
        const email = req.body.email || 'demo@college.edu';
        const demoResult = evaluateCreditProfile(DEMO_FINANCIAL_PROFILE);

        if (isDBConnected()) {
            const resetProfile = await Profile.findOneAndUpdate(
                { userEmail: email },
                {
                    inputs: demoResult.inputs,
                    scores: demoResult.scores,
                    rating: demoResult.rating,
                    breakdown: demoResult.breakdown,
                    source: 'Demo Reset'
                },
                { new: true, upsert: true }
            );

            return res.json({ success: true, isMongo: true, profile: resetProfile });
        }

        res.json({ success: true, isMongo: false, profile: demoResult });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
