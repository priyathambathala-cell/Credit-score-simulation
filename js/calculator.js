/**
 * ============================================================================
 * Credit Score Calculator - Unified Single-Page Controller
 * ============================================================================
 * Handles real-time validation, single-card calculation, mathematical explanation,
 * preset demo population, and saving to student history.
 */

import {
    evaluateCreditProfile,
    validateInputs,
    calculateIncomeScore,
    calculateRepaymentScore,
    calculateDebtScore,
    calculateWeightedScore,
    DEMO_FINANCIAL_PROFILE,
    WEIGHTS
} from './scoring-engine.js';
import { StorageService } from './storage.js';
import { UI } from './main.js';

export const CalculatorController = {
    currentResult: null,

    init() {
        this.cacheDOM();
        this.attachEvents();
        this.populateInitialData();
    },

    cacheDOM() {
        // Form & Inputs
        this.form = document.getElementById('calc-form');
        this.inputIncome = document.getElementById('input-income');
        this.inputTotalRepayments = document.getElementById('input-total-repayments');
        this.inputOnTimeRepayments = document.getElementById('input-ontime-repayments');
        this.inputDebt = document.getElementById('input-debt');

        // Buttons & Action Triggers
        this.btnCalculate = document.getElementById('btn-calculate');
        this.btnLoadDemo = document.getElementById('btn-load-demo');
        this.btnSaveHistory = document.getElementById('btn-save-to-history');
        this.btnSendToSim = document.getElementById('btn-send-to-simulator');

        // Display Panels & Error Box
        this.errorBox = document.getElementById('calc-error-box');
        this.emptyState = document.getElementById('calc-empty-state');
        this.resultContainer = document.getElementById('calc-result-container');

        // Result Score Elements
        this.resScore = document.getElementById('calc-res-score');
        this.resRating = document.getElementById('calc-res-rating');

        // Factor Pills
        this.resIncomeScore = document.getElementById('calc-res-income-score');
        this.resIncomeWeighted = document.getElementById('calc-res-income-weighted');
        this.resRepayScore = document.getElementById('calc-res-repay-score');
        this.resRepayWeighted = document.getElementById('calc-res-repay-weighted');
        this.resDebtScore = document.getElementById('calc-res-debt-score');
        this.resDebtWeighted = document.getElementById('calc-res-debt-weighted');

        // Explainer Formulas
        this.formulaIncome = document.getElementById('calc-res-formula-income');
        this.formulaRepayment = document.getElementById('calc-res-formula-repayment');
        this.formulaDebt = document.getElementById('calc-res-formula-debt');
        this.formulaFinal = document.getElementById('calc-res-formula-final');
    },

    attachEvents() {
        // Form Submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCalculate(true);
            });
        }

        // Live input listeners for clearing errors
        [this.inputIncome, this.inputTotalRepayments, this.inputOnTimeRepayments, this.inputDebt].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    this.hideError();
                });
            }
        });

        // Load Demo Data
        if (this.btnLoadDemo) {
            this.btnLoadDemo.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadDemoData();
            });
        }

        // Save Result to History
        if (this.btnSaveHistory) {
            this.btnSaveHistory.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveCurrentCalculationToHistory();
            });
        }

        // Send to Decision Simulator
        if (this.btnSendToSim) {
            this.btnSendToSim.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.currentResult) {
                    StorageService.saveCurrentProfile(this.currentResult);
                    window.location.href = 'simulation.html';
                } else {
                    UI.showToast('Please calculate a score first.', 'warning');
                }
            });
        }
    },

    getFormValues() {
        return {
            monthlyIncome: this.inputIncome ? this.inputIncome.value.trim() : '50000',
            totalRepayments: this.inputTotalRepayments ? this.inputTotalRepayments.value.trim() : '10',
            onTimeRepayments: this.inputOnTimeRepayments ? this.inputOnTimeRepayments.value.trim() : '9',
            existingDebt: this.inputDebt ? this.inputDebt.value.trim() : '100000'
        };
    },

    showError(message) {
        if (this.errorBox) {
            this.errorBox.innerHTML = `<span>⚠️</span> <span>${message}</span>`;
            this.errorBox.style.display = 'flex';
            this.errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            UI.showToast(message, 'error');
        }
    },

    hideError() {
        if (this.errorBox) {
            this.errorBox.style.display = 'none';
        }
    },

    handleCalculate(showToastNotice = true) {
        const rawInputs = this.getFormValues();
        const validation = validateInputs(rawInputs);

        if (!validation.isValid) {
            this.showError(validation.errors[0]);
            return;
        }

        this.hideError();

        try {
            const result = evaluateCreditProfile(rawInputs);
            this.currentResult = result;
            
            // Persist as current active profile in local storage
            StorageService.saveCurrentProfile(result);

            this.renderResult(result);

            if (showToastNotice) {
                UI.showToast(`Evaluation Complete! Estimated Score: ${Math.round(result.scores.finalScore)} / 100 (${result.rating.label})`, 'success');
            }

            // Scroll result into view on mobile
            if (window.innerWidth <= 768 && this.resultContainer) {
                this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (err) {
            this.showError(err.message || 'An unexpected calculation error occurred.');
        }
    },

    renderResult(result) {
        if (!result) return;
        const { inputs, scores, rating, breakdown } = result;

        // Show result card and hide empty state
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.resultContainer) this.resultContainer.style.display = 'block';

        // Score and Rating Badge
        if (this.resScore) this.resScore.textContent = Math.round(scores.finalScore);
        if (this.resRating) {
            this.resRating.textContent = rating.label;
            this.resRating.className = `rating-badge ${rating.class}`;
        }

        // 3 Factor Summary Pills
        if (this.resIncomeScore) this.resIncomeScore.textContent = `${scores.incomeScore} / 100`;
        if (this.resIncomeWeighted) this.resIncomeWeighted.textContent = `+${scores.weightedIncome} pts (30%)`;

        if (this.resRepayScore) this.resRepayScore.textContent = `${scores.repaymentScore}%`;
        if (this.resRepayWeighted) this.resRepayWeighted.textContent = `+${scores.weightedRepayment} pts (50%)`;

        if (this.resDebtScore) this.resDebtScore.textContent = `${scores.debtScore} / 100`;
        if (this.resDebtWeighted) this.resDebtWeighted.textContent = `+${scores.weightedDebt} pts (20%)`;

        // Educational Formulas
        if (this.formulaIncome) this.formulaIncome.textContent = breakdown.incomeFormula || `${scores.incomeScore} × 30% = ${scores.weightedIncome}`;
        if (this.formulaRepayment) this.formulaRepayment.textContent = breakdown.repaymentFormula || `${scores.repaymentScore}% × 50% = ${scores.weightedRepayment}`;
        if (this.formulaDebt) this.formulaDebt.textContent = breakdown.debtFormula || `${scores.debtScore} × 20% = ${scores.weightedDebt}`;
        if (this.formulaFinal) this.formulaFinal.textContent = breakdown.finalFormula || `${scores.weightedIncome} + ${scores.weightedRepayment} + ${scores.weightedDebt} = ${scores.finalScore}`;
    },

    populateInitialData() {
        const savedProfile = StorageService.getCurrentProfile();
        if (savedProfile && savedProfile.inputs) {
            if (this.inputIncome) this.inputIncome.value = savedProfile.inputs.monthlyIncome;
            if (this.inputTotalRepayments) this.inputTotalRepayments.value = savedProfile.inputs.totalRepayments;
            if (this.inputOnTimeRepayments) this.inputOnTimeRepayments.value = savedProfile.inputs.onTimeRepayments;
            if (this.inputDebt) this.inputDebt.value = savedProfile.inputs.existingDebt;
            this.currentResult = savedProfile;
            this.renderResult(savedProfile);
        } else {
            this.loadDemoData(false);
        }
    },

    loadDemoData(showToast = true) {
        if (this.inputIncome) this.inputIncome.value = DEMO_FINANCIAL_PROFILE.monthlyIncome;
        if (this.inputTotalRepayments) this.inputTotalRepayments.value = DEMO_FINANCIAL_PROFILE.totalRepayments;
        if (this.inputOnTimeRepayments) this.inputOnTimeRepayments.value = DEMO_FINANCIAL_PROFILE.onTimeRepayments;
        if (this.inputDebt) this.inputDebt.value = DEMO_FINANCIAL_PROFILE.existingDebt;

        this.hideError();
        this.handleCalculate(showToast);

        if (showToast) {
            UI.showToast('Loaded standard demo baseline (Score: 83 GOOD)', 'info');
        }
    },

    saveCurrentCalculationToHistory() {
        if (!this.currentResult) {
            UI.showToast('Please calculate a score first.', 'warning');
            return;
        }

        StorageService.addScoreHistoryEntry({
            type: 'Manual Calculation',
            note: `Score ${Math.round(this.currentResult.scores.finalScore)} (${this.currentResult.rating.label})`,
            ...this.currentResult
        });

        UI.showToast('Score result saved to History successfully!', 'success');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calculator-app')) {
        CalculatorController.init();
    }
});

if (typeof window !== 'undefined') {
    window.CalculatorController = CalculatorController;
}
