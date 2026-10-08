/**
 * ============================================================================
 * Credit Score Simulation Engine - Core Scoring Engine
 * ============================================================================
 * Educational Project: 2nd-Year B.Tech Computer Science / Information Technology
 * 
 * Architecture Note:
 * This module is designed using a Strategy-inspired architecture where each
 * financial factor (Income, Repayment, Debt) has dedicated scoring rules and weights.
 * 
 * Rules Definition:
 * 1. Income Weight: 30% (0.30)
 *    - < ₹20,000       -> 40
 *    - ₹20,000-₹39,999 -> 60
 *    - ₹40,000-₹59,999 -> 80
 *    - >= ₹60,000      -> 100
 * 
 * 2. Repayment Weight: 50% (0.50)
 *    - Percentage = (On-time repayments / Total repayments) * 100
 *    - Score = Repayment Percentage
 * 
 * 3. Debt Weight: 20% (0.20)
 *    - ₹0 - ₹50,000          -> 100
 *    - ₹50,001 - ₹1,00,000   -> 70
 *    - ₹1,00,001 - ₹2,00,000 -> 50
 *    - > ₹2,00,000           -> 30
 * 
 * Final Score = (IncomeScore * 0.30) + (RepaymentScore * 0.50) + (DebtScore * 0.20)
 * 
 * Ratings:
 * - 80 - 100 -> GOOD
 * - 60 - 79  -> AVERAGE
 * - Below 60 -> POOR
 * ============================================================================
 */

// Weight constants for easy maintenance and viva explanation
export const WEIGHTS = {
    INCOME: 0.30,
    REPAYMENT: 0.50,
    DEBT: 0.20
};

// Ratings configuration
export const RATINGS = {
    GOOD: { label: 'GOOD', min: 80, max: 100, class: 'rating-good', color: '#10b981', desc: 'Favorable educational profile' },
    AVERAGE: { label: 'AVERAGE', min: 60, max: 79.99, class: 'rating-average', color: '#f59e0b', desc: 'Moderate educational profile' },
    POOR: { label: 'POOR', min: 0, max: 59.99, class: 'rating-poor', color: '#ef4444', desc: 'Needs improvement in educational model' }
};

/**
 * Strategy 1: Income Score Calculation
 * Determines the score based on monthly income bracket.
 * 
 * @param {number} monthlyIncome 
 * @returns {number} Score between 40 and 100
 */
export function calculateIncomeScore(monthlyIncome) {
    const income = Number(monthlyIncome);
    if (isNaN(income) || income < 0) {
        throw new Error('Monthly income must be a non-negative number.');
    }

    if (income < 20000) {
        return 40;
    } else if (income >= 20000 && income <= 39999) {
        return 60;
    } else if (income >= 40000 && income <= 59999) {
        return 80;
    } else {
        // ₹60,000 and above
        return 100;
    }
}

/**
 * Strategy 2: Repayment Score Calculation
 * Calculates percentage of on-time repayments out of total records.
 * 
 * @param {number} onTimeRepayments 
 * @param {number} totalRepayments 
 * @returns {number} Score between 0 and 100 (percentage)
 */
export function calculateRepaymentScore(onTimeRepayments, totalRepayments) {
    const onTime = Number(onTimeRepayments);
    const total = Number(totalRepayments);

    if (isNaN(onTime) || isNaN(total)) {
        throw new Error('Repayment records must be valid numbers.');
    }
    if (total <= 0) {
        throw new Error('Total repayment records must be greater than zero.');
    }
    if (onTime < 0) {
        throw new Error('On-time repayments cannot be negative.');
    }
    if (onTime > total) {
        throw new Error('On-time repayments cannot exceed total repayment records.');
    }

    const percentage = (onTime / total) * 100;
    // Round to 2 decimal places if fractional, but return clean number
    return Math.round(percentage * 100) / 100;
}

/**
 * Strategy 3: Existing Debt Score Calculation
 * Determines score inversely related to existing debt obligations.
 * 
 * @param {number} existingDebt 
 * @returns {number} Score between 30 and 100
 */
export function calculateDebtScore(existingDebt) {
    const debt = Number(existingDebt);
    if (isNaN(debt) || debt < 0) {
        throw new Error('Existing debt must be a non-negative number.');
    }

    if (debt <= 50000) {
        return 100;
    } else if (debt > 50000 && debt <= 100000) {
        return 70;
    } else if (debt > 100000 && debt <= 200000) {
        return 50;
    } else {
        // Above ₹2,00,000
        return 30;
    }
}

/**
 * Calculates the weighted contribution of a factor.
 * 
 * @param {number} score - Raw factor score (0-100)
 * @param {number} weight - Factor weight (e.g., 0.30)
 * @returns {number} Weighted score
 */
export function calculateWeightedScore(score, weight) {
    return Math.round(score * weight * 100) / 100;
}

/**
 * Calculates the final estimated credit score from the three factor scores.
 * Formula: (IncomeScore * 0.30) + (RepaymentScore * 0.50) + (DebtScore * 0.20)
 * 
 * @param {number} incomeScore 
 * @param {number} repaymentScore 
 * @param {number} debtScore 
 * @returns {number} Final score (0-100)
 */
export function calculateFinalScore(incomeScore, repaymentScore, debtScore) {
    const weightedIncome = incomeScore * WEIGHTS.INCOME;
    const weightedRepayment = repaymentScore * WEIGHTS.REPAYMENT;
    const weightedDebt = debtScore * WEIGHTS.DEBT;

    const rawFinal = weightedIncome + weightedRepayment + weightedDebt;
    return Math.round(rawFinal * 100) / 100;
}

/**
 * Determines the educational credit rating based on the score.
 * 
 * @param {number} score (0-100)
 * @returns {object} Rating details { label, color, class, desc }
 */
export function getCreditRating(score) {
    const numScore = Number(score);
    if (numScore >= 80) {
        return RATINGS.GOOD;
    } else if (numScore >= 60) {
        return RATINGS.AVERAGE;
    } else {
        return RATINGS.POOR;
    }
}

/**
 * Validates financial input data.
 * 
 * @param {object} input - { monthlyIncome, totalRepayments, onTimeRepayments, existingDebt }
 * @returns {object} { isValid: boolean, errors: string[] }
 */
export function validateInputs(input) {
    const errors = [];

    const income = Number(input.monthlyIncome);
    const total = Number(input.totalRepayments);
    const onTime = Number(input.onTimeRepayments);
    const debt = Number(input.existingDebt);

    if (input.monthlyIncome === '' || input.monthlyIncome === null || isNaN(income)) {
        errors.push('Please enter your monthly income.');
    } else if (income < 0) {
        errors.push('Monthly income cannot be negative.');
    }

    if (input.totalRepayments === '' || input.totalRepayments === null || isNaN(total)) {
        errors.push('Please enter the total number of repayment records.');
    } else if (total <= 0) {
        errors.push('Total repayments must be at least 1 record.');
    }

    if (input.onTimeRepayments === '' || input.onTimeRepayments === null || isNaN(onTime)) {
        errors.push('Please enter on-time repayment records.');
    } else if (onTime < 0) {
        errors.push('On-time repayments cannot be negative.');
    } else if (!isNaN(total) && onTime > total) {
        errors.push('On-time repayments cannot exceed total repayment records.');
    }

    if (input.existingDebt === '' || input.existingDebt === null || isNaN(debt)) {
        errors.push('Please enter your existing debt amount.');
    } else if (debt < 0) {
        errors.push('Existing debt cannot be negative.');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Complete Evaluation Engine: Takes raw financial inputs and computes
 * comprehensive credit scoring results with full breakdown and step explanations.
 * 
 * @param {object} input - { monthlyIncome, totalRepayments, onTimeRepayments, existingDebt }
 * @returns {object} Complete evaluation result object
 */
export function evaluateCreditProfile(input) {
    const validation = validateInputs(input);
    if (!validation.isValid) {
        throw new Error(validation.errors.join(' '));
    }

    const income = Number(input.monthlyIncome);
    const total = Number(input.totalRepayments);
    const onTime = Number(input.onTimeRepayments);
    const debt = Number(input.existingDebt);

    // Compute raw factor scores
    const incomeScore = calculateIncomeScore(income);
    const repaymentScore = calculateRepaymentScore(onTime, total);
    const debtScore = calculateDebtScore(debt);

    // Compute weighted scores
    const weightedIncome = calculateWeightedScore(incomeScore, WEIGHTS.INCOME);
    const weightedRepayment = calculateWeightedScore(repaymentScore, WEIGHTS.REPAYMENT);
    const weightedDebt = calculateWeightedScore(debtScore, WEIGHTS.DEBT);

    // Compute final score
    const finalScore = calculateFinalScore(incomeScore, repaymentScore, debtScore);
    const rating = getCreditRating(finalScore);

    return {
        inputs: {
            monthlyIncome: income,
            totalRepayments: total,
            onTimeRepayments: onTime,
            existingDebt: debt,
            repaymentPercentage: repaymentScore
        },
        scores: {
            incomeScore,
            repaymentScore,
            debtScore,
            weightedIncome,
            weightedRepayment,
            weightedDebt,
            finalScore
        },
        rating,
        breakdown: {
            incomeFormula: `${incomeScore} × 30% = ${weightedIncome}`,
            repaymentFormula: `${repaymentScore}% × 50% = ${weightedRepayment}`,
            debtFormula: `${debtScore} × 20% = ${weightedDebt}`,
            finalFormula: `${weightedIncome} + ${weightedRepayment} + ${weightedDebt} = ${finalScore}`
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Simulates financial changes by comparing current profile with simulated profile.
 * 
 * @param {object} currentInput 
 * @param {object} simulatedInput 
 * @returns {object} Simulation comparison details with deltas
 */
export function simulateCreditChange(currentInput, simulatedInput) {
    const currentResult = evaluateCreditProfile(currentInput);
    const simulatedResult = evaluateCreditProfile(simulatedInput);

    const scoreDelta = Math.round((simulatedResult.scores.finalScore - currentResult.scores.finalScore) * 100) / 100;
    const incomeScoreDelta = simulatedResult.scores.incomeScore - currentResult.scores.incomeScore;
    const repaymentScoreDelta = Math.round((simulatedResult.scores.repaymentScore - currentResult.scores.repaymentScore) * 100) / 100;
    const debtScoreDelta = simulatedResult.scores.debtScore - currentResult.scores.debtScore;

    return {
        current: currentResult,
        simulated: simulatedResult,
        deltas: {
            scoreDelta,
            incomeScoreDelta,
            repaymentScoreDelta,
            debtScoreDelta,
            isImprovement: scoreDelta > 0,
            isDrop: scoreDelta < 0,
            isUnchanged: scoreDelta === 0,
            ratingChanged: currentResult.rating.label !== simulatedResult.rating.label
        }
    };
}

/**
 * Standard Demo Data (Produces exact 83 score, GOOD rating)
 */
export const DEMO_FINANCIAL_PROFILE = {
    monthlyIncome: 50000,
    totalRepayments: 10,
    onTimeRepayments: 9,
    existingDebt: 100000
};

// Expose globally on window for easy standard script inclusion or ES module usage
if (typeof window !== 'undefined') {
    window.CreditScoringEngine = {
        WEIGHTS,
        RATINGS,
        calculateIncomeScore,
        calculateRepaymentScore,
        calculateDebtScore,
        calculateWeightedScore,
        calculateFinalScore,
        getCreditRating,
        validateInputs,
        evaluateCreditProfile,
        simulateCreditChange,
        DEMO_FINANCIAL_PROFILE
    };
}
