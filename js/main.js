/**
 * ============================================================================
 * Main UI Controller & Common Utilities
 * ============================================================================
 * Handles responsive mobile navigation, toast alerts, currency formatting,
 * and common educational UI helper components.
 */

import { AuthService } from './auth.js';

export const UI = {
    /**
     * Format number to Indian Rupee (INR) format (e.g. ₹50,000)
     */
    formatCurrency(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
        return '₹' + Number(amount).toLocaleString('en-IN');
    },

    /**
     * Show temporary floating notification toast
     */
    showToast(message, type = 'info') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '⚠️';
        if (type === 'warning') icon = '🔔';

        toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    /**
     * Setup mobile menu toggles for both public navbar and internal sidebar
     */
    initMobileNav() {
        const toggleBtn = document.querySelector('.mobile-nav-toggle');
        const sidebar = document.querySelector('.sidebar');
        const publicNavLinks = document.querySelector('.public-navbar .nav-links');

        // Sidebar backdrop
        let backdrop = document.querySelector('.sidebar-backdrop');
        if (sidebar && !backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'sidebar-backdrop';
            document.body.appendChild(backdrop);
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                if (sidebar) {
                    sidebar.classList.toggle('open');
                    if (backdrop) backdrop.classList.toggle('active');
                } else if (publicNavLinks) {
                    publicNavLinks.classList.toggle('open');
                }
            });
        }

        if (backdrop && sidebar) {
            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('open');
                backdrop.classList.remove('active');
            });
        }
    },

    /**
     * Highlight current active page link in navbar / sidebar
     */
    highlightActiveNav() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link, .menu-link');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath === '' && href === 'index.html')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    /**
     * Modal trigger helpers
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    initModals() {
        document.querySelectorAll('[data-modal-target]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-modal-target');
                UI.openModal(targetId);
            });
        });

        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = btn.closest('.modal-backdrop');
                if (modal) modal.classList.remove('active');
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }
};

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
    UI.initMobileNav();
    UI.highlightActiveNav();
    UI.initModals();
});

if (typeof window !== 'undefined') {
    window.UI = UI;
}
