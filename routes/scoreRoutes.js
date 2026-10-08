/**
 * ============================================================================
 * Scoring & Simulation Routes - Express API
 * ============================================================================
 */

import express from 'express';
import { evaluateCreditProfile, simulateCreditChange, validateInputs } from '../js/scoring-engine.js';
import ScoreHistory from '../models/ScoreHistory.js';
import { isDBConnected } from '../config/db.js';

const router = express.Router();

/**
 * Calculate Estimated Credit Score
 * POST /api/scores/calculate
 */
router.post('/calculate', async (req, res) => {
    try {
        const { monthlyIncome, totalRepayments, onTimeRepayments, existingDebt, userEmail, saveToDb } = req.body;

        const validation = validateInputs({ monthlyIncome, totalRepayments, onTimeRepayments, existingDebt });
        if (!validation.isValid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const result = evaluateCreditProfile({ monthlyIncome, totalRepayments, onTimeRepayments, existingDebt });

        // Save to MongoDB if requested and connected
        if (saveToDb && isDBConnected()) {
            await ScoreHistory.create({
                userEmail: userEmail || 'demo@college.edu',
                type: 'Manual Calculation',
                inputs: result.inputs,
                scores: result.scores,
                rating: result.rating,
                breakdown: result.breakdown,
                formattedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                note: `Score ${Math.round(result.scores.finalScore)} (${result.rating.label})`
            });
        }

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Run Decision Simulation
 * POST /api/scores/simulate
 */
router.post('/simulate', async (req, res) => {
    try {
        const { currentInputs, simulatedInputs, userEmail, saveToDb } = req.body;

        const currentVal = validateInputs(currentInputs);
        const simVal = validateInputs(simulatedInputs);

        if (!currentVal.isValid || !simVal.isValid) {
            return res.status(400).json({
                success: false,
                errors: [...currentVal.errors, ...simVal.errors]
            });
        }

        const comparison = simulateCreditChange(currentInputs, simulatedInputs);

        if (saveToDb && isDBConnected()) {
            const sign = comparison.deltas.scoreDelta >= 0 ? `+${comparison.deltas.scoreDelta}` : comparison.deltas.scoreDelta;
            await ScoreHistory.create({
                userEmail: userEmail || 'demo@college.edu',
                type: 'Simulation',
                inputs: comparison.simulated.inputs,
                scores: comparison.simulated.scores,
                rating: comparison.simulated.rating,
                breakdown: comparison.simulated.breakdown,
                simulationMeta: {
                    baselineScore: comparison.current.scores.finalScore,
                    simulatedScore: comparison.simulated.scores.finalScore,
                    delta: comparison.deltas.scoreDelta
                },
                formattedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                note: `Simulated: ${Math.round(comparison.current.scores.finalScore)} → ${Math.round(comparison.simulated.scores.finalScore)} (${sign} pts)`
            });
        }

        res.json({ success: true, comparison });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
