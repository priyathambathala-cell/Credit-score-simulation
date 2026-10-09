/**
 * ============================================================================
 * Score History Controller
 * ============================================================================
 * Manages simulation and calculation history logs, filtering, detailed view modals,
 * record deletion, and educational export functionality.
 */

import { StorageService } from './storage.js';
import { UI } from './main.js';

export const HistoryController = {
    records: [],

    init() {
        this.cacheDOM();
        this.loadAndRender();
        this.attachEvents();
    },

    cacheDOM() {
        this.tableBody = document.getElementById('history-table-body');
        this.emptyState = document.getElementById('history-empty-state');
        this.totalCountElem = document.getElementById('history-total-count');
        this.filterRating = document.getElementById('history-filter-rating');
        this.filterType = document.getElementById('history-filter-type');
        this.btnClearHistory = document.getElementById('btn-clear-history');
        this.btnExportCSV = document.getElementById('btn-export-csv');

        // Modal elements
        this.modal = document.getElementById('history-detail-modal');
        this.modalBody = document.getElementById('history-modal-body');
    },

    attachEvents() {
        if (this.filterRating) {
            this.filterRating.addEventListener('change', () => this.filterAndRender());
        }

        if (this.filterType) {
            this.filterType.addEventListener('change', () => this.filterAndRender());
        }

        if (this.btnClearHistory) {
            this.btnClearHistory.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all score simulation history records?')) {
                    StorageService.clearAllHistory();
                    this.loadAndRender();
                    UI.showToast('Score history cleared successfully.', 'info');
                }
            });
        }

        if (this.btnExportCSV) {
            this.btnExportCSV.addEventListener('click', () => this.exportCSV());
        }
    },

    loadAndRender() {
        this.records = StorageService.getScoreHistory();
        this.filterAndRender();
    },

    filterAndRender() {
        const ratingFilter = this.filterRating ? this.filterRating.value : 'ALL';
        const typeFilter = this.filterType ? this.filterType.value : 'ALL';

        let filtered = [...this.records];

        if (ratingFilter !== 'ALL') {
            filtered = filtered.filter(item => item.rating && item.rating.label === ratingFilter);
        }

        if (typeFilter !== 'ALL') {
            filtered = filtered.filter(item => item.type === typeFilter);
        }

        if (this.totalCountElem) {
            this.totalCountElem.textContent = `${filtered.length} entries`;
        }

        if (!this.tableBody) return;

        if (filtered.length === 0) {
            this.tableBody.innerHTML = '';
            if (this.emptyState) this.emptyState.style.display = 'block';
            return;
        }

        if (this.emptyState) this.emptyState.style.display = 'none';

        this.tableBody.innerHTML = filtered.map(item => `
            <tr>
                <td>
                    <div style="font-weight:600; color:var(--navy-900);">
                        ${item.formattedDate || new Date(item.timestamp).toLocaleDateString('en-IN')}
                    </div>
                    <span class="badge ${item.type === 'Simulation' ? 'badge-sim' : 'badge-edu'}" style="font-size:0.65rem; margin-top:2px;">
                        ${item.type || 'Calculation'}
                    </span>
                </td>
                <td>${UI.formatCurrency(item.inputs.monthlyIncome)}</td>
                <td><strong>${item.inputs.repaymentPercentage}%</strong> <span style="font-size:0.75rem; color:var(--slate-400);">(${item.inputs.onTimeRepayments}/${item.inputs.totalRepayments})</span></td>
                <td>${UI.formatCurrency(item.inputs.existingDebt)}</td>
                <td>
                    <strong style="color:var(--navy-900); font-size:1.1rem; font-family:var(--font-heading);">
                        ${Math.round(item.scores.finalScore)}
                    </strong>
                    <span style="color:var(--slate-400); font-size:0.75rem;">/100</span>
                </td>
                <td>
                    <span class="rating-badge ${item.rating.class}">${item.rating.label}</span>
                </td>
                <td>
                    <div style="display:flex; gap:0.35rem;">
                        <button class="btn btn-outline btn-sm btn-view-detail" data-id="${item.id}" title="View Details">
                            View
                        </button>
                        <button class="btn btn-danger-outline btn-sm btn-delete-row" data-id="${item.id}" title="Delete Record">
                            ✕
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach action events for dynamic rows
        document.querySelectorAll('.btn-view-detail').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.viewDetailModal(id);
            });
        });

        document.querySelectorAll('.btn-delete-row').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                StorageService.deleteScoreHistoryEntry(id);
                this.loadAndRender();
                UI.showToast('Record deleted.', 'info');
            });
        });
    },

    viewDetailModal(id) {
        const item = this.records.find(r => r.id === id);
        if (!item) return;

        if (this.modalBody) {
            this.modalBody.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
                    <div>
                        <span class="badge ${item.type === 'Simulation' ? 'badge-sim' : 'badge-edu'}">${item.type}</span>
                        <div style="font-size:0.8rem; color:var(--slate-500); margin-top:4px;">${item.formattedDate}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:2rem; font-weight:800; font-family:var(--font-heading); color:var(--navy-900);">${Math.round(item.scores.finalScore)} / 100</div>
                        <span class="rating-badge ${item.rating.class}">${item.rating.label}</span>
                    </div>
                </div>

                <h4 style="font-size:0.9rem; margin-bottom:0.5rem;">Input Parameters</h4>
                <div class="form-row-2col" style="background:var(--slate-50); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:0.875rem; margin-bottom:1.25rem; font-size:0.85rem; gap:0.75rem;">
                    <div>Monthly Income: <strong>${UI.formatCurrency(item.inputs.monthlyIncome)}</strong></div>
                    <div>Repayment Ratio: <strong>${item.inputs.onTimeRepayments}/${item.inputs.totalRepayments} (${item.inputs.repaymentPercentage}%)</strong></div>
                    <div>Existing Debt: <strong>${UI.formatCurrency(item.inputs.existingDebt)}</strong></div>
                    <div>Note: <strong>${item.note || 'None'}</strong></div>
                </div>

                <h4 style="font-size:0.9rem; margin-bottom:0.5rem;">Formula Breakdown</h4>
                <div style="background:var(--blue-50); border:1px solid #bfdbfe; border-radius:var(--radius-md); padding:0.875rem; font-size:0.825rem; color:#1e3a8a; font-family:'Courier New', monospace; display:flex; flex-direction:column; gap:0.35rem;">
                    <div>Income: ${item.breakdown.incomeFormula}</div>
                    <div>Repayment: ${item.breakdown.repaymentFormula}</div>
                    <div>Debt: ${item.breakdown.debtFormula}</div>
                    <hr style="border:none; border-top:1px dashed #93c5fd; margin:4px 0;">
                    <div style="font-weight:bold;">Final: ${item.breakdown.finalFormula}</div>
                </div>
            `;
        }

        UI.openModal('history-detail-modal');
    },

    exportCSV() {
        if (this.records.length === 0) {
            UI.showToast('No history records to export.', 'warning');
            return;
        }

        const headers = ['Record ID', 'Date', 'Type', 'Income', 'Total Repayments', 'On-Time Repayments', 'Repayment %', 'Debt', 'Score', 'Rating'];
        const rows = this.records.map(r => [
            r.id,
            `"${r.formattedDate || r.timestamp}"`,
            r.type || 'Calculation',
            r.inputs.monthlyIncome,
            r.inputs.totalRepayments,
            r.inputs.onTimeRepayments,
            r.inputs.repaymentPercentage,
            r.inputs.existingDebt,
            Math.round(r.scores.finalScore),
            r.rating.label
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `credit_score_simulation_history_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        UI.showToast('Exported history CSV file successfully!', 'success');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('history-app')) {
        HistoryController.init();
    }
});

if (typeof window !== 'undefined') {
    window.HistoryController = HistoryController;
}
