/**
 * ============================================================================
 * History Routes - Express API for MongoDB
 * ============================================================================
 */

import express from 'express';
import ScoreHistory from '../models/ScoreHistory.js';
import { isDBConnected } from '../config/db.js';

const router = express.Router();

/**
 * Get all history records
 * GET /api/history
 */
router.get('/', async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, isMongo: false, history: [] });
        }

        const history = await ScoreHistory.find().sort({ createdAt: -1 }).limit(100);
        res.json({ success: true, isMongo: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Add history record
 * POST /api/history
 */
router.post('/', async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, isMongo: false, message: 'Saved in local mode' });
        }

        const recordData = req.body;
        if (!recordData.formattedDate) {
            recordData.formattedDate = new Date().toLocaleDateString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }

        const newRecord = await ScoreHistory.create(recordData);
        res.status(201).json({ success: true, isMongo: true, record: newRecord });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Delete a specific record
 * DELETE /api/history/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, isMongo: false });
        }

        await ScoreHistory.findByIdAndDelete(req.params.id);
        res.json({ success: true, isMongo: true, message: 'Record deleted from MongoDB' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Clear all history records
 * DELETE /api/history
 */
router.delete('/', async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, isMongo: false });
        }

        await ScoreHistory.deleteMany({});
        res.json({ success: true, isMongo: true, message: 'All records cleared from MongoDB' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
