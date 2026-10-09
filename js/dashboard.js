/**
 * ============================================================================
 * Dashboard Controller - Interactive Control Hub
 * ============================================================================
 * Renders the student dashboard with estimated score, live gauge,
 * factor progress breakdown, 1-click hypothetical scenario simulator,
 * and direct dashboard tool options.
 */

import { StorageService } from './storage.js';
import { AuthService } from './auth.js';
import { evaluateCreditProfile, DEMO_FINANCIAL_PROFILE } from './scoring-engine.js';
import { UI } from './main.js';

export const DashboardController = {
    activeScenario: null,

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

    renderDashboard(customData = null) {
        const data = customData || this.getCurrentData();
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
        // Quick Reset to Demo Button in Topbar
        const btnResetDemo = document.getElementById('btn-reset-demo-profile');
        if (btnResetDemo) {
            btnResetDemo.addEventListener('click', () => {
                const demoResult = evaluateCreditProfile(DEMO_FINANCIAL_PROFILE);
                demoResult.source = 'Demo Reset';
                StorageService.saveCurrentProfile(demoResult);
                this.activeScenario = null;
                this.clearScenarioHighlight();
                this.renderDashboard();
                UI.showToast('Profile reset to standard Demo profile (Score: 83)', 'success');
            });
        }

        // Quick Calculator Button in Hub
        const btnQuickCalc = document.getElementById('btn-dash-quick-calc');
        if (btnQuickCalc) {
            btnQuickCalc.addEventListener('click', () => {
                window.location.href = 'calculator.html';
            });
        }

        // 1-Click Hypothetical Scenario Switches
        const scenarioBtns = document.querySelectorAll('.btn-scenario-pill');
        const btnRevert = document.getElementById('btn-revert-scenario');

        scenarioBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const scenario = btn.getAttribute('data-scenario');
                this.applyScenario(scenario, btn);
            });
        });

        if (btnRevert) {
            btnRevert.addEventListener('click', () => {
                this.activeScenario = null;
                this.clearScenarioHighlight();
                if (btnRevert) btnRevert.style.display = 'none';
                this.renderDashboard();
                UI.showToast('Reverted back to your saved profile baseline.', 'info');
            });
        }

        // Display Toggles on Dashboard
        const toggleVivaMath = document.getElementById('toggle-viva-math');
        const toggleGaugePulse = document.getElementById('toggle-gauge-pulse');
        const toggleAutoSave = document.getElementById('toggle-auto-save');

        if (toggleVivaMath) {
            toggleVivaMath.addEventListener('change', (e) => {
                const breakdownCard = document.querySelector('.breakdown-card');
                if (breakdownCard) {
                    breakdownCard.style.display = e.target.checked ? 'flex' : 'none';
                }
            });
        }

        if (toggleGaugePulse) {
            toggleGaugePulse.addEventListener('change', (e) => {
                const meterCard = document.querySelector('.score-visualizer-card');
                if (meterCard) {
                    meterCard.style.opacity = e.target.checked ? '1' : '0.85';
                }
            });
        }

        if (toggleAutoSave) {
            toggleAutoSave.addEventListener('change', (e) => {
                localStorage.setItem('scoresim_auto_save', e.target.checked ? 'true' : 'false');
                UI.showToast(`Auto-save to history is now ${e.target.checked ? 'ENABLED' : 'DISABLED'}.`, 'info');
            });
        }
    },

    applyScenario(scenarioType, activeBtn) {
        const base = this.getCurrentData().inputs;
        let simulatedInputs = { ...base };
        let scenarioName = '';

        if (scenarioType === 'income_raise') {
            simulatedInputs.monthlyIncome = 75000;
            scenarioName = 'Salary Raise (+₹25,000/mo)';
        } else if (scenarioType === 'perfect_repay') {
            simulatedInputs.totalRepayments = 10;
            simulatedInputs.onTimeRepayments = 10;
            scenarioName = '100% On-Time Repayments';
        } else if (scenarioType === 'debt_payoff') {
            simulatedInputs.existingDebt = 50000;
            scenarioName = 'Debt Paid Off (-₹50,000)';
        } else if (scenarioType === 'default_missed') {
            simulatedInputs.totalRepayments = 10;
            simulatedInputs.onTimeRepayments = 7;
            scenarioName = '2 Missed Loan Defaults';
        }

        this.activeScenario = scenarioType;
        this.clearScenarioHighlight();
        if (activeBtn) activeBtn.classList.add('active');

        const btnRevert = document.getElementById('btn-revert-scenario');
        if (btnRevert) btnRevert.style.display = 'inline-block';

        const result = evaluateCreditProfile(simulatedInputs);
        this.renderDashboard(result);

        UI.showToast(`Simulated: ${scenarioName} → Score: ${Math.round(result.scores.finalScore)} (${result.rating.label})`, 'info');
    },

    clearScenarioHighlight() {
        document.querySelectorAll('.btn-scenario-pill').forEach(btn => btn.classList.remove('active'));
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
