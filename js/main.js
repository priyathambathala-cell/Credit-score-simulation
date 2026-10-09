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
        const toggleBtns = document.querySelectorAll('.mobile-nav-toggle');
        const sidebar = document.querySelector('.sidebar');
        const publicNavLinks = document.querySelector('.public-navbar .nav-links');
        const closeBtns = document.querySelectorAll('.sidebar-close-btn');

        // Sidebar backdrop
        let backdrop = document.querySelector('.sidebar-backdrop');
        if (sidebar && !backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'sidebar-backdrop';
            document.body.appendChild(backdrop);
        }

        const closeSidebar = () => {
            if (sidebar) sidebar.classList.remove('open');
            if (backdrop) backdrop.classList.remove('active');
        };

        const toggleSidebar = () => {
            if (sidebar) {
                const isOpen = sidebar.classList.toggle('open');
                if (backdrop) backdrop.classList.toggle('active', isOpen);
            }
        };

        toggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (sidebar) {
                    toggleSidebar();
                } else if (publicNavLinks) {
                    publicNavLinks.classList.toggle('open');
                }
            });
        });

        closeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeSidebar();
            });
        });

        if (backdrop) {
            backdrop.addEventListener('click', closeSidebar);
        }

        // Auto close sidebar when a menu link is tapped
        if (sidebar) {
            sidebar.querySelectorAll('.menu-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        closeSidebar();
                    }
                });
            });
        }

        // Close public navbar when clicking outside
        if (publicNavLinks) {
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.public-navbar') && publicNavLinks.classList.contains('open')) {
                    publicNavLinks.classList.remove('open');
                }
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
    },

    /**
     * Password show/hide toggle for input fields
     */
    initPasswordToggles() {
        document.querySelectorAll('.btn-toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (!input) return;

                const isPassword = input.getAttribute('type') === 'password';
                input.setAttribute('type', isPassword ? 'text' : 'password');

                const eyeSpan = btn.querySelector('.eye-icon');
                if (eyeSpan) {
                    eyeSpan.textContent = isPassword ? '🙈' : '👁️';
                }
                const label = isPassword ? 'Hide password' : 'Show password';
                btn.setAttribute('aria-label', label);
                btn.setAttribute('title', label);
            });
        });
    }
};

// Initialize UI on load
document.addEventListener('DOMContentLoaded', () => {
    UI.initMobileNav();
    UI.highlightActiveNav();
    UI.initModals();
    UI.initPasswordToggles();
});

if (typeof window !== 'undefined') {
    window.UI = UI;
}
