/**
 * ============================================================================
 * Credit Score Calculator Controller
 * ============================================================================
 * Handles user input collection, live validation, rule execution,
 * calculation visualization, demo data filling, and saving results.
 */

import {
    evaluateCreditProfile,
    validateInputs,
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
        this.populateFromCurrentProfile();
    },

    cacheDOM() {
        this.form = document.getElementById('calc-form');
        this.inputIncome = document.getElementById('input-income');
        this.inputTotalRepayments = document.getElementById('input-total-repayments');
        this.inputOnTimeRepayments = document.getElementById('input-ontime-repayments');
        this.inputDebt = document.getElementById('input-debt');

        this.btnCalculate = document.getElementById('btn-calculate');
        this.btnLoadDemo = document.getElementById('btn-load-demo');
        this.btnSaveHistory = document.getElementById('btn-save-to-history');
        this.btnSendToSim = document.getElementById('btn-send-to-simulator');

        this.errorBox = document.getElementById('calc-error-box');
        this.emptyState = document.getElementById('calc-empty-state');
        this.resultContainer = document.getElementById('calc-result-container');
    },

    attachEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCalculate();
            });
        }

        if (this.btnLoadDemo) {
            this.btnLoadDemo.addEventListener('click', () => {
                this.loadDemoData();
            });
        }

        if (this.btnSaveHistory) {
            this.btnSaveHistory.addEventListener('click', () => {
                this.saveCurrentCalculationToHistory();
            });
        }

        if (this.btnSendToSim) {
            this.btnSendToSim.addEventListener('click', () => {
                if (this.currentResult) {
                    StorageService.saveCurrentProfile(this.currentResult);
                    window.location.href = 'simulation.html';
                }
            });
        }

        // Live validation clearing on input
        [this.inputIncome, this.inputTotalRepayments, this.inputOnTimeRepayments, this.inputDebt].forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.hideError());
            }
        });
    },

    populateFromCurrentProfile() {
        const profile = StorageService.getCurrentProfile();
        if (profile && profile.inputs) {
            this.inputIncome.value = profile.inputs.monthlyIncome;
            this.inputTotalRepayments.value = profile.inputs.totalRepayments;
            this.inputOnTimeRepayments.value = profile.inputs.onTimeRepayments;
            this.inputDebt.value = profile.inputs.existingDebt;
            this.handleCalculate(false); // Evaluate quietly
        }
    },

    loadDemoData() {
        this.inputIncome.value = DEMO_FINANCIAL_PROFILE.monthlyIncome;
        this.inputTotalRepayments.value = DEMO_FINANCIAL_PROFILE.totalRepayments;
        this.inputOnTimeRepayments.value = DEMO_FINANCIAL_PROFILE.onTimeRepayments;
        this.inputDebt.value = DEMO_FINANCIAL_PROFILE.existingDebt;
        
        UI.showToast('Loaded standard demo profile (₹50k Income, 9/10 Repayments, ₹1L Debt)', 'info');
        this.handleCalculate(true);
    },

    getFormValues() {
        return {
            monthlyIncome: this.inputIncome.value.trim(),
            totalRepayments: this.inputTotalRepayments.value.trim(),
            onTimeRepayments: this.inputOnTimeRepayments.value.trim(),
            existingDebt: this.inputDebt.value.trim()
        };
    },

    showError(message) {
        if (this.errorBox) {
            this.errorBox.innerHTML = `<span>⚠️</span> <span>${message}</span>`;
            this.errorBox.style.display = 'flex';
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
            
            // Save as active profile
            StorageService.saveCurrentProfile(result);

            this.renderResult(result);

            if (showToastNotice) {
                UI.showToast(`Calculation complete: Score is ${Math.round(result.scores.finalScore)} (${result.rating.label})`, 'success');
            }
        } catch (err) {
            this.showError(err.message);
        }
    },

    renderResult(result) {
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.resultContainer) this.resultContainer.style.display = 'block';

        const { inputs, scores, rating, breakdown } = result;

        // Header score and rating
        const numElem = document.getElementById('calc-res-score');
        const ratingBadge = document.getElementById('calc-res-rating');
        if (numElem) numElem.textContent = Math.round(scores.finalScore);
        if (ratingBadge) {
            ratingBadge.textContent = rating.label;
            ratingBadge.className = `rating-badge ${rating.class}`;
        }

        // Factor summary pills
        const pillIncomeScore = document.getElementById('calc-res-income-score');
        const pillIncomeWeight = document.getElementById('calc-res-income-weighted');
        const pillRepayScore = document.getElementById('calc-res-repay-score');
        const pillRepayWeight = document.getElementById('calc-res-repay-weighted');
        const pillDebtScore = document.getElementById('calc-res-debt-score');
        const pillDebtWeight = document.getElementById('calc-res-debt-weighted');

        if (pillIncomeScore) pillIncomeScore.textContent = `${scores.incomeScore} / 100`;
        if (pillIncomeWeight) pillIncomeWeight.textContent = `+${scores.weightedIncome} pts (30%)`;

        if (pillRepayScore) pillRepayScore.textContent = `${scores.repaymentScore}%`;
        if (pillRepayWeight) pillRepayWeight.textContent = `+${scores.weightedRepayment} pts (50%)`;

        if (pillDebtScore) pillDebtScore.textContent = `${scores.debtScore} / 100`;
        if (pillDebtWeight) pillDebtWeight.textContent = `+${scores.weightedDebt} pts (20%)`;

        // Breakdown formulas
        const formulaIncome = document.getElementById('calc-res-formula-income');
        const formulaRepayment = document.getElementById('calc-res-formula-repayment');
        const formulaDebt = document.getElementById('calc-res-formula-debt');
        const formulaFinal = document.getElementById('calc-res-formula-final');

        if (formulaIncome) formulaIncome.textContent = breakdown.incomeFormula;
        if (formulaRepayment) formulaRepayment.textContent = breakdown.repaymentFormula;
        if (formulaDebt) formulaDebt.textContent = breakdown.debtFormula;
        if (formulaFinal) formulaFinal.textContent = breakdown.finalFormula;
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
