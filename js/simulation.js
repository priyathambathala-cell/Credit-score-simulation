/**
 * ============================================================================
 * Financial Decision Simulator Controller
 * ============================================================================
 * Key Project Feature: Compares current financial profile with a simulated
 * hypothetical future condition, calculating delta variations in factors and score.
 */

import {
    evaluateCreditProfile,
    simulateCreditChange,
    validateInputs,
    DEMO_FINANCIAL_PROFILE
} from './scoring-engine.js';
import { StorageService } from './storage.js';
import { UI } from './main.js';

export const SimulationController = {
    currentProfileData: null,
    lastSimulationResult: null,

    init() {
        this.cacheDOM();
        this.loadBaseProfile();
        this.attachEvents();
        this.runSimulation(); // Initial simulation run
    },

    cacheDOM() {
        // Current Profile elements
        this.curIncome = document.getElementById('sim-cur-income');
        this.curRepay = document.getElementById('sim-cur-repay');
        this.curDebt = document.getElementById('sim-cur-debt');
        this.curScore = document.getElementById('sim-cur-score');
        this.curRating = document.getElementById('sim-cur-rating');

        // Simulation Input controls
        this.inputSimIncome = document.getElementById('sim-input-income');
        this.inputSimTotalRepay = document.getElementById('sim-input-total-repay');
        this.inputSimOnTimeRepay = document.getElementById('sim-input-ontime-repay');
        this.inputSimDebt = document.getElementById('sim-input-debt');

        // Output comparison elements
        this.simNewScore = document.getElementById('sim-new-score');
        this.simNewRating = document.getElementById('sim-new-rating');
        this.deltaScorePill = document.getElementById('sim-delta-pill');
        this.deltaScoreText = document.getElementById('sim-delta-text');

        // Factor changes
        this.deltaIncomeChange = document.getElementById('sim-delta-income');
        this.deltaRepayChange = document.getElementById('sim-delta-repay');
        this.deltaDebtChange = document.getElementById('sim-delta-debt');

        // Comparison progress bars
        this.barCurIncome = document.getElementById('sim-bar-cur-income');
        this.barSimIncome = document.getElementById('sim-bar-sim-income');
        this.barCurRepay = document.getElementById('sim-bar-cur-repay');
        this.barSimRepay = document.getElementById('sim-bar-sim-repay');
        this.barCurDebt = document.getElementById('sim-bar-cur-debt');
        this.barSimDebt = document.getElementById('sim-bar-sim-debt');

        // Buttons
        this.btnRunSim = document.getElementById('btn-run-simulation');
        this.btnResetSim = document.getElementById('btn-reset-simulation');
        this.btnSaveSim = document.getElementById('btn-save-simulation');
        this.btnLoadExample = document.getElementById('btn-load-sim-example');
    },

    loadBaseProfile() {
        let profile = StorageService.getCurrentProfile();
        if (!profile || !profile.inputs) {
            profile = evaluateCreditProfile(DEMO_FINANCIAL_PROFILE);
            StorageService.saveCurrentProfile(profile);
        }
        this.currentProfileData = profile;

        // Render Current Profile Panel
        if (this.curIncome) this.curIncome.textContent = UI.formatCurrency(profile.inputs.monthlyIncome);
        if (this.curRepay) this.curRepay.textContent = `${profile.inputs.repaymentPercentage}% (${profile.inputs.onTimeRepayments}/${profile.inputs.totalRepayments})`;
        if (this.curDebt) this.curDebt.textContent = UI.formatCurrency(profile.inputs.existingDebt);
        if (this.curScore) this.curScore.textContent = Math.round(profile.scores.finalScore);
        if (this.curRating) {
            this.curRating.textContent = profile.rating.label;
            this.curRating.className = `rating-badge ${profile.rating.class}`;
        }

        // Initialize simulation inputs with current values
        this.inputSimIncome.value = profile.inputs.monthlyIncome;
        this.inputSimTotalRepay.value = profile.inputs.totalRepayments;
        this.inputSimOnTimeRepay.value = profile.inputs.onTimeRepayments;
        this.inputSimDebt.value = profile.inputs.existingDebt;
    },

    attachEvents() {
        if (this.btnRunSim) {
            this.btnRunSim.addEventListener('click', (e) => {
                e.preventDefault();
                this.runSimulation(true);
            });
        }

        if (this.btnResetSim) {
            this.btnResetSim.addEventListener('click', () => {
                this.loadBaseProfile();
                this.runSimulation(false);
                UI.showToast('Reset simulation inputs to match current profile.', 'info');
            });
        }

        if (this.btnSaveSim) {
            this.btnSaveSim.addEventListener('click', () => {
                this.saveSimulationRecord();
            });
        }

        if (this.btnLoadExample) {
            this.btnLoadExample.addEventListener('click', () => {
                this.applyPreset('debt_increase');
            });
        }

        // Preset scenario buttons
        document.querySelectorAll('[data-scenario]').forEach(btn => {
            btn.addEventListener('click', () => {
                const scenario = btn.getAttribute('data-scenario');
                this.applyPreset(scenario);
            });
        });
    },

    applyPreset(scenarioKey) {
        // Reset base to demo standard first for predictable demonstration
        this.inputSimIncome.value = 50000;
        this.inputSimTotalRepay.value = 10;
        this.inputSimOnTimeRepay.value = 9;
        this.inputSimDebt.value = 100000;

        switch (scenarioKey) {
            case 'debt_increase':
                // Problem statement example: Debt increases to ₹2,50,000 (Score drops from 83 to 75)
                this.inputSimDebt.value = 250000;
                UI.showToast('Preset loaded: Existing Debt increased to ₹2,50,000 (>₹2L drops score to 30)', 'info');
                break;
            case 'perfect_repay':
                // 100% on-time repayment records
                this.inputSimOnTimeRepay.value = 10;
                UI.showToast('Preset loaded: 100% On-Time Repayments (10/10)', 'info');
                break;
            case 'income_promotion':
                // Salary raise to ₹70,000
                this.inputSimIncome.value = 70000;
                UI.showToast('Preset loaded: Monthly Income increased to ₹70,000 (Bracket score = 100)', 'info');
                break;
            case 'missed_payments':
                // 3 missed payments (7 on-time out of 10)
                this.inputSimOnTimeRepay.value = 7;
                UI.showToast('Preset loaded: 3 Late/Missed Repayments (70% on-time)', 'warning');
                break;
            case 'debt_clearance':
                // Cleared debt down to ₹25,000
                this.inputSimDebt.value = 25000;
                UI.showToast('Preset loaded: Debt reduced to ₹25,000 (Highest debt score = 100)', 'info');
                break;
        }

        this.runSimulation(true);
    },

    getSimulatedInputs() {
        return {
            monthlyIncome: this.inputSimIncome.value.trim(),
            totalRepayments: this.inputSimTotalRepay.value.trim(),
            onTimeRepayments: this.inputSimOnTimeRepay.value.trim(),
            existingDebt: this.inputSimDebt.value.trim()
        };
    },

    runSimulation(showNotice = false) {
        const simInputs = this.getSimulatedInputs();
        const validation = validateInputs(simInputs);

        if (!validation.isValid) {
            UI.showToast(validation.errors[0], 'error');
            return;
        }

        try {
            const comparison = simulateCreditChange(this.currentProfileData.inputs, simInputs);
            this.lastSimulationResult = comparison;
            this.renderComparison(comparison);

            if (showNotice) {
                const delta = comparison.deltas.scoreDelta;
                const sign = delta > 0 ? `+${delta}` : delta;
                UI.showToast(`Simulation complete: Score change is ${sign} pts`, delta >= 0 ? 'success' : 'warning');
            }
        } catch (err) {
            UI.showToast(err.message, 'error');
        }
    },

    renderComparison(simData) {
        const { current, simulated, deltas } = simData;

        // Simulated score and rating
        if (this.simNewScore) this.simNewScore.textContent = Math.round(simulated.scores.finalScore);
        if (this.simNewRating) {
            this.simNewRating.textContent = simulated.rating.label;
            this.simNewRating.className = `rating-badge ${simulated.rating.class}`;
        }

        // Delta Score Pill
        if (this.deltaScorePill) {
            let symbol = '↔';
            let pillClass = 'delta-neutral';
            let signStr = '0';

            if (deltas.isImprovement) {
                symbol = '↑';
                pillClass = 'delta-positive';
                signStr = `+${deltas.scoreDelta}`;
            } else if (deltas.isDrop) {
                symbol = '↓';
                pillClass = 'delta-negative';
                signStr = `${deltas.scoreDelta}`;
            }

            this.deltaScorePill.className = `delta-pill-big ${pillClass}`;
            this.deltaScorePill.innerHTML = `<span>${symbol}</span> <span>${signStr} pts</span>`;
        }

        if (this.deltaScoreText) {
            if (deltas.isImprovement) {
                this.deltaScoreText.innerHTML = `Estimated score improves by <strong>+${deltas.scoreDelta}</strong> points. Rating is <strong>${simulated.rating.label}</strong>.`;
            } else if (deltas.isDrop) {
                this.deltaScoreText.innerHTML = `Estimated score decreases by <strong>${Math.abs(deltas.scoreDelta)}</strong> points. Rating is <strong>${simulated.rating.label}</strong>.`;
            } else {
                this.deltaScoreText.innerHTML = `Estimated score remains unchanged at <strong>${Math.round(simulated.scores.finalScore)}</strong> points.`;
            }
        }

        // Factor level changes format
        this.renderFactorDelta(this.deltaIncomeChange, deltas.incomeScoreDelta, current.scores.incomeScore, simulated.scores.incomeScore);
        this.renderFactorDelta(this.deltaRepayChange, deltas.repaymentScoreDelta, current.scores.repaymentScore, simulated.scores.repaymentScore, '%');
        this.renderFactorDelta(this.deltaDebtChange, deltas.debtScoreDelta, current.scores.debtScore, simulated.scores.debtScore);

        // Visual Comparison Bars
        if (this.barCurIncome) this.barCurIncome.style.width = `${current.scores.incomeScore}%`;
        if (this.barSimIncome) this.barSimIncome.style.width = `${simulated.scores.incomeScore}%`;

        if (this.barCurRepay) this.barCurRepay.style.width = `${current.scores.repaymentScore}%`;
        if (this.barSimRepay) this.barSimRepay.style.width = `${simulated.scores.repaymentScore}%`;

        if (this.barCurDebt) this.barCurDebt.style.width = `${current.scores.debtScore}%`;
        if (this.barSimDebt) this.barSimDebt.style.width = `${simulated.scores.debtScore}%`;
    },

    renderFactorDelta(elem, delta, oldVal, newVal, unit = '') {
        if (!elem) return;
        let symbol = '↔';
        let color = 'var(--slate-600)';

        if (delta > 0) {
            symbol = '↑ +';
            color = 'var(--emerald-600)';
        } else if (delta < 0) {
            symbol = '↓ ';
            color = 'var(--rose-600)';
        }

        elem.innerHTML = `
            <span style="color: ${color}; font-weight:700;">
                ${symbol}${Math.abs(delta)}${unit}
            </span>
            <span style="color: var(--slate-400); font-size: 0.775rem;">(${oldVal}${unit} → ${newVal}${unit})</span>
        `;
    },

    saveSimulationRecord() {
        if (!this.lastSimulationResult) {
            UI.showToast('Please run a simulation first.', 'warning');
            return;
        }

        const { current, simulated, deltas } = this.lastSimulationResult;
        const sign = deltas.scoreDelta >= 0 ? `+${deltas.scoreDelta}` : deltas.scoreDelta;

        StorageService.addScoreHistoryEntry({
            type: 'Simulation',
            note: `Simulated: ${Math.round(current.scores.finalScore)} → ${Math.round(simulated.scores.finalScore)} (${sign} pts)`,
            inputs: simulated.inputs,
            scores: simulated.scores,
            rating: simulated.rating,
            breakdown: simulated.breakdown,
            simulationMeta: {
                baselineScore: current.scores.finalScore,
                simulatedScore: simulated.scores.finalScore,
                delta: deltas.scoreDelta
            }
        });

        UI.showToast('Simulation experiment saved to Score History!', 'success');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('simulation-app')) {
        SimulationController.init();
    }
});

if (typeof window !== 'undefined') {
    window.SimulationController = SimulationController;
}
