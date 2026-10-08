/**
 * ============================================================================
 * Score History Model - MongoDB Schema
 * ============================================================================
 * Stores credit evaluation results, factor breakdowns, and simulation logs.
 */

import mongoose from 'mongoose';

const scoreHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    userEmail: {
        type: String,
        default: 'demo@college.edu'
    },
    type: {
        type: String,
        enum: ['Manual Calculation', 'Simulation', 'Demo Preset', 'Calculation'],
        default: 'Manual Calculation'
    },
    note: {
        type: String,
        default: ''
    },
    inputs: {
        monthlyIncome: { type: Number, required: true },
        totalRepayments: { type: Number, required: true },
        onTimeRepayments: { type: Number, required: true },
        existingDebt: { type: Number, required: true },
        repaymentPercentage: { type: Number, required: true }
    },
    scores: {
        incomeScore: { type: Number, required: true },
        repaymentScore: { type: Number, required: true },
        debtScore: { type: Number, required: true },
        weightedIncome: { type: Number, required: true },
        weightedRepayment: { type: Number, required: true },
        weightedDebt: { type: Number, required: true },
        finalScore: { type: Number, required: true }
    },
    rating: {
        label: { type: String, required: true },
        min: Number,
        max: Number,
        class: String,
        color: String,
        desc: String
    },
    breakdown: {
        incomeFormula: String,
        repaymentFormula: String,
        debtFormula: String,
        finalFormula: String
    },
    simulationMeta: {
        baselineScore: Number,
        simulatedScore: Number,
        delta: Number
    },
    formattedDate: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const ScoreHistory = mongoose.model('ScoreHistory', scoreHistorySchema);
export default ScoreHistory;
