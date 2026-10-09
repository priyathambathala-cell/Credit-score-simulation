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

    /**
     * Desktop View Recommendation Banner, Auto-Popup Modal & Mobile Floating Trigger
     */
    initDesktopNotice() {
        // 1. Create Top Banner
        let banner = document.querySelector('.desktop-notice-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'desktop-notice-banner';
            banner.innerHTML = `
                <div class="desktop-notice-content">
                    <div class="desktop-notice-text">
                        <span style="font-size: 1.25rem;">🖥️</span>
                        <span><strong>Desktop / Laptop View Recommended:</strong> For optimal visual analytics, formulas, and decision simulation, access on a desktop screen or enable <strong>"Desktop Site"</strong> in your mobile browser.</span>
                    </div>
                    <div class="desktop-notice-actions">
                        <button type="button" class="btn-desktop-guide" id="btn-show-desktop-guide">
                            📖 How to turn on Desktop Site
                        </button>
                        <button type="button" class="btn-desktop-dismiss" id="btn-dismiss-desktop-notice" title="Dismiss notice" aria-label="Dismiss">
                            ✕
                        </button>
                    </div>
                </div>
            `;

            const disclaimer = document.querySelector('.disclaimer-banner');
            if (disclaimer && disclaimer.nextSibling) {
                disclaimer.parentNode.insertBefore(banner, disclaimer.nextSibling);
            } else {
                document.body.prepend(banner);
            }
        }

        // 2. Create Persistent Floating Trigger Pill for Mobile
        let triggerPill = document.querySelector('.mobile-desktop-trigger-pill');
        if (!triggerPill) {
            triggerPill = document.createElement('button');
            triggerPill.type = 'button';
            triggerPill.className = 'mobile-desktop-trigger-pill';
            triggerPill.id = 'mobile-desktop-trigger-pill';
            triggerPill.innerHTML = `<span>🖥️</span> <span>Desktop Site Guide</span>`;
            document.body.appendChild(triggerPill);
            triggerPill.addEventListener('click', () => {
                UI.openDesktopGuideModal();
            });
        }

        // 3. Attach banner listeners
        const btnGuide = document.getElementById('btn-show-desktop-guide');
        const btnDismiss = document.getElementById('btn-dismiss-desktop-notice');

        if (btnDismiss) {
            btnDismiss.addEventListener('click', () => {
                if (banner) banner.style.display = 'none';
            });
        }

        if (btnGuide) {
            btnGuide.addEventListener('click', () => {
                UI.openDesktopGuideModal();
            });
        }

        // 4. Auto Pop-up Modal on Mobile Screens (< 992px)
        const isMobileScreen = window.innerWidth <= 992 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        const hasSeenPopup = sessionStorage.getItem('scoresim_desktop_popup_seen') === 'true';

        if (isMobileScreen && !hasSeenPopup) {
            setTimeout(() => {
                UI.openDesktopGuideModal();
                sessionStorage.setItem('scoresim_desktop_popup_seen', 'true');
            }, 350);
        }
    },

    openDesktopGuideModal() {
        let modal = document.getElementById('modal-desktop-guide');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-desktop-guide';
            modal.className = 'desktop-popup-modal';
            modal.innerHTML = `
                <div class="desktop-popup-card">
                    <div class="desktop-popup-header">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <span class="badge badge-edu" style="font-size: 0.72rem; padding: 0.2rem 0.6rem;">🖥️ Device Recommendation</span>
                            <button class="modal-close" style="color: #cbd5e1; font-size: 1.25rem; background: none; border: none; cursor: pointer;" data-modal-close aria-label="Close modal">✕</button>
                        </div>
                        <h3>🖥️ Please Access On Desktop Site Only</h3>
                    </div>
                    <div class="desktop-popup-body">
                        <p style="font-size: 0.9rem; color: var(--slate-700); line-height: 1.6; margin-bottom: 1.25rem;">
                            This <strong>Credit Score Simulation Engine</strong> is designed for <strong>Desktop / Laptop</strong> widescreen displays with multi-factor gauge charts, scenario sliders, and mathematical matrices.
                        </p>

                        <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: #1e40af;">
                            💡 <strong>All simulation options are on the Dashboard screen:</strong> You can turn on all features, 1-click scenarios, and scoring tools right in the Dashboard after login.
                        </div>

                        <div style="font-weight: 800; font-size: 0.85rem; color: var(--navy-900); margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 0.05em;">
                            How to turn on Desktop Site in your phone:
                        </div>

                        <!-- Browser Step Cards -->
                        <div class="guide-step-card">
                            <div class="guide-step-header">
                                <div class="guide-step-num">1</div>
                                <span>Google Chrome (Android / iPhone)</span>
                            </div>
                            <ol style="margin-left: 1.5rem; font-size: 0.85rem; color: var(--slate-700); line-height: 1.6;">
                                <li>Tap the <strong>three vertical dots (⋮)</strong> in top-right corner.</li>
                                <li>Select and check <strong>"Desktop site"</strong>.</li>
                                <li>The page will reload in full desktop mode.</li>
                            </ol>
                        </div>

                        <div class="guide-step-card">
                            <div class="guide-step-header">
                                <div class="guide-step-num">2</div>
                                <span>Apple Safari (iOS / iPadOS)</span>
                            </div>
                            <ol style="margin-left: 1.5rem; font-size: 0.85rem; color: var(--slate-700); line-height: 1.6;">
                                <li>Tap <strong>"aA"</strong> in the bottom/top address bar.</li>
                                <li>Tap <strong>"Request Desktop Website"</strong>.</li>
                            </ol>
                        </div>
                    </div>
                    <div class="desktop-popup-footer">
                        <button type="button" class="btn btn-outline" style="font-size: 0.85rem;" data-modal-close>
                            Close Alert
                        </button>
                        <a href="dashboard.html" class="btn btn-primary" style="font-size: 0.85rem;">
                            📊 Open Dashboard (All Options) →
                        </a>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Close button listeners
            modal.querySelectorAll('[data-modal-close]').forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        }

        modal.classList.add('active');
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
                const modal = btn.closest('.modal-backdrop, .desktop-popup-modal');
                if (modal) modal.classList.remove('active');
            });
        });

        // Close on backdrop click
        document.querySelectorAll('.modal-backdrop, .desktop-popup-modal').forEach(modal => {
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
    UI.initDesktopNotice();
});

if (typeof window !== 'undefined') {
    window.UI = UI;
}
