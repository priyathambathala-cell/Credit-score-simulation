/**
 * ============================================================================
 * Dashboard Controller
 * ============================================================================
 * Renders the student dashboard with current estimated score, rating,
 * breakdown calculations, factor progress meters, and recent score activities.
 * Enforces authentication so the dashboard opens ONLY after signing up / logging in.
 */

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { evaluateCreditProfile, DEMO_FINANCIAL_PROFILE } from './scoring-engine.js';
import { UI } from './main.js';

export const DashboardController = {
    init() {
        // Enforce account sign-up before dashboard opens
        if (!AuthService.requireAuth('register.html')) {
            return;
        }

        this.renderDashboard();
        this.attachEventListeners();
    },

    getCurrentData() {
        let profile = StorageService.getCurrentProfile();
        if (!profile) {
            // Seed initial evaluation if empty
            profile = evaluateCreditProfile(DEMO_FINANCIAL_PROFILE);
            profile.source = 'Initial Evaluation';
            StorageService.saveCurrentProfile(profile);
        }
        return profile;
    },

    renderDashboard() {
        const data = this.getCurrentData();
        const { inputs, scores, rating, breakdown } = data;

        // 1. Summary Cards
        const elemScore = document.getElementById('dash-score-value');
        const elemRating = document.getElementById('dash-rating-value');
        const elemIncomeScore = document.getElementById('dash-income-score');
        const elemRepayScore = document.getElementById('dash-repay-score');
        const elemDebtScore = document.getElementById('dash-debt-score');

        if (elemScore) elemScore.textContent = Math.round(scores.finalScore);
        if (elemRating) {
            elemRating.textContent = rating.label;
            elemRating.className = `rating-badge ${rating.class}`;
        }
        if (elemIncomeScore) elemIncomeScore.textContent = scores.incomeScore;
        if (elemRepayScore) elemRepayScore.textContent = `${scores.repaymentScore}%`;
        if (elemDebtScore) elemDebtScore.textContent = scores.debtScore;

        // 2. Circular Meter Chart
        const meterNum = document.getElementById('meter-score-num');
        const meterCircle = document.getElementById('meter-fill-circle');
        const meterRating = document.getElementById('meter-rating-badge');

        if (meterNum) meterNum.textContent = Math.round(scores.finalScore);
        if (meterCircle) {
            const scoreVal = Math.min(100, Math.max(0, scores.finalScore));
            meterCircle.setAttribute('stroke-dasharray', `${scoreVal}, 100`);
            meterCircle.setAttribute('stroke', rating.color);
        }
        if (meterRating) {
            meterRating.textContent = `${rating.label} RATING`;
            meterRating.className = `badge rating-badge ${rating.class}`;
        }

        // 3. Factor Progress Bars
        const barIncome = document.getElementById('progress-bar-income');
        const barRepayment = document.getElementById('progress-bar-repayment');
        const barDebt = document.getElementById('progress-bar-debt');

        const labelIncome = document.getElementById('bar-label-income');
        const labelRepayment = document.getElementById('bar-label-repayment');
        const labelDebt = document.getElementById('bar-label-debt');

        if (barIncome) barIncome.style.width = `${scores.incomeScore}%`;
        if (barRepayment) barRepayment.style.width = `${scores.repaymentScore}%`;
        if (barDebt) barDebt.style.width = `${scores.debtScore}%`;

        if (labelIncome) labelIncome.textContent = `${scores.incomeScore} / 100 (${UI.formatCurrency(inputs.monthlyIncome)}/mo)`;
        if (labelRepayment) labelRepayment.textContent = `${scores.repaymentScore}% (${inputs.onTimeRepayments}/${inputs.totalRepayments} on-time)`;
        if (labelDebt) labelDebt.textContent = `${scores.debtScore} / 100 (${UI.formatCurrency(inputs.existingDebt)} total debt)`;

        // 4. Breakdown Formulas
        const formulaIncome = document.getElementById('calc-formula-income');
        const formulaRepayment = document.getElementById('calc-formula-repayment');
        const formulaDebt = document.getElementById('calc-formula-debt');
        const formulaFinal = document.getElementById('calc-formula-final');

        if (formulaIncome) formulaIncome.textContent = breakdown.incomeFormula || `${scores.incomeScore} × 30% = ${scores.weightedIncome}`;
        if (formulaRepayment) formulaRepayment.textContent = breakdown.repaymentFormula || `${scores.repaymentScore}% × 50% = ${scores.weightedRepayment}`;
        if (formulaDebt) formulaDebt.textContent = breakdown.debtFormula || `${scores.debtScore} × 20% = ${scores.weightedDebt}`;
        if (formulaFinal) formulaFinal.textContent = breakdown.finalFormula || `${scores.weightedIncome} + ${scores.weightedRepayment} + ${scores.weightedDebt} = ${scores.finalScore}`;

        // 5. Recent History Preview
        this.renderRecentHistory();
    },

    renderRecentHistory() {
        const historyTableBody = document.getElementById('dash-recent-history-body');
        if (!historyTableBody) return;

        const history = StorageService.getScoreHistory().slice(0, 3);
        if (history.length === 0) {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding: 2rem; color: var(--slate-400);">
                        No calculations yet. Run your first simulation from the Calculator.
                    </td>
                </tr>
            `;
            return;
        }

        historyTableBody.innerHTML = history.map(item => `
            <tr>
                <td><strong>${item.formattedDate || new Date(item.timestamp).toLocaleDateString()}</strong></td>
                <td>${UI.formatCurrency(item.inputs.monthlyIncome)}</td>
                <td>${item.inputs.repaymentPercentage}%</td>
                <td>${UI.formatCurrency(item.inputs.existingDebt)}</td>
                <td><strong style="color:var(--navy-900); font-size:1.05rem;">${Math.round(item.scores.finalScore)} / 100</strong></td>
                <td><span class="rating-badge ${item.rating.class}">${item.rating.label}</span></td>
            </tr>
        `).join('');
    },

    attachEventListeners() {
        // Quick Reset to Demo Button
        const btnResetDemo = document.getElementById('btn-reset-demo-profile');
        if (btnResetDemo) {
            btnResetDemo.addEventListener('click', () => {
                const demoResult = evaluateCreditProfile(DEMO_FINANCIAL_PROFILE);
                demoResult.source = 'Demo Reset';
                StorageService.saveCurrentProfile(demoResult);
                this.renderDashboard();
                UI.showToast('Profile reset to standard Demo profile (Score: 83)', 'success');
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dashboard-app')) {
        DashboardController.init();
    }
});

if (typeof window !== 'undefined') {
    window.DashboardController = DashboardController;
}
