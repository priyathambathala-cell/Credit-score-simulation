/**
 * ============================================================================
 * Financial Profile Model - MongoDB Schema
 * ============================================================================
 * Persists the user's active baseline financial profile.
 */

import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    userEmail: {
        type: String,
        default: 'demo@college.edu',
        unique: true
    },
    inputs: {
        monthlyIncome: { type: Number, default: 50000 },
        totalRepayments: { type: Number, default: 10 },
        onTimeRepayments: { type: Number, default: 9 },
        existingDebt: { type: Number, default: 100000 },
        repaymentPercentage: { type: Number, default: 90 }
    },
    scores: {
        incomeScore: { type: Number, default: 80 },
        repaymentScore: { type: Number, default: 90 },
        debtScore: { type: Number, default: 70 },
        weightedIncome: { type: Number, default: 24 },
        weightedRepayment: { type: Number, default: 45 },
        weightedDebt: { type: Number, default: 14 },
        finalScore: { type: Number, default: 83 }
    },
    rating: {
        label: { type: String, default: 'GOOD' },
        class: { type: String, default: 'rating-good' },
        color: { type: String, default: '#10b981' },
        desc: { type: String, default: 'Favorable educational profile' }
    },
    breakdown: {
        incomeFormula: { type: String, default: '80 × 30% = 24' },
        repaymentFormula: { type: String, default: '90% × 50% = 45' },
        debtFormula: { type: String, default: '70 × 20% = 14' },
        finalFormula: { type: String, default: '24 + 45 + 14 = 83' }
    },
    source: {
        type: String,
        default: 'Baseline Demo'
    }
}, {
    timestamps: true
});

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;
