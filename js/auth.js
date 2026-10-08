/**
 * ============================================================================
 * Auth Module - Student Authentication & Route Protection
 * ============================================================================
 * Handles registration, login, logout, and protected view route guarding.
 * Ensures the dashboard is only accessible after signing up or logging in.
 */

import { StorageService } from './storage.js';

export const AuthService = {
    /**
     * Check if a user is currently authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        const user = StorageService.getCurrentUser();
        return !!(user && user.email);
    },

    /**
     * Get active logged in user info
     */
    getUser() {
        return StorageService.getCurrentUser() || null;
    },

    /**
     * Route guard: Call this on protected pages (dashboard.html, profile.html, history.html).
     * If not logged in, immediately redirects to sign-up page.
     */
    requireAuth(redirectUrl = 'register.html') {
        if (!this.isAuthenticated()) {
            const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
            window.location.replace(`${redirectUrl}?redirect=${encodeURIComponent(currentPath)}&msg=signup_required`);
            return false;
        }
        return true;
    },

    /**
     * Register a new educational account
     * @param {string} fullName 
     * @param {string} email 
     * @param {string} password 
     * @param {string} confirmPassword 
     */
    async register(fullName, email, password, confirmPassword) {
        const errors = [];
        if (!fullName || fullName.trim().length < 2) {
            errors.push('Full name must be at least 2 characters.');
        }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            errors.push('Please provide a valid email address.');
        }
        if (!password || password.length < 6) {
            errors.push('Password must be at least 6 characters.');
        }
        if (confirmPassword !== undefined && password !== confirmPassword) {
            errors.push('Passwords do not match.');
        }

        if (errors.length > 0) {
            return { success: false, errors };
        }

        const trimmedEmail = email.trim().toLowerCase();
        const trimmedName = fullName.trim();

        // 1. Check local registered users list
        const users = StorageService.getRegisteredUsers();
        const existing = users.find(u => u.email.toLowerCase() === trimmedEmail);
        if (existing) {
            return { success: false, errors: ['An account with this email already exists. Please log in.'] };
        }

        let userObj = {
            id: 'user_' + Date.now(),
            fullName: trimmedName,
            email: trimmedEmail,
            password: password,
            role: '2nd Year B.Tech Student',
            createdAt: new Date().toISOString()
        };

        // 2. Try registering with MongoDB backend
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: trimmedName, email: trimmedEmail, password })
            });
            const data = await res.json();
            if (data && data.success && data.user) {
                userObj = { ...userObj, ...data.user };
            } else if (data && !data.success && data.message) {
                // If backend rejected because already exists
                if (data.message.includes('already exists')) {
                    return { success: false, errors: [data.message] };
                }
            }
        } catch (e) {
            console.warn('Backend offline; storing user locally in browser storage.');
        }

        // 3. Save locally and establish active session
        StorageService.saveUser(userObj);
        StorageService.setCurrentUser(userObj);

        return { success: true, user: userObj };
    },

    /**
     * Log in with credentials
     * @param {string} email 
     * @param {string} password 
     */
    async login(email, password) {
        if (!email || !password) {
            return { success: false, errors: ['Please enter both email and password.'] };
        }

        const trimmedEmail = email.trim().toLowerCase();

        // 1. Try backend MongoDB login
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmedEmail, password })
            });
            const data = await res.json();
            if (data && data.success && data.user) {
                const loggedInUser = {
                    id: data.user.id || data.user._id || ('user_' + Date.now()),
                    fullName: data.user.fullName,
                    email: data.user.email,
                    role: data.user.role || '2nd Year B.Tech Student'
                };
                StorageService.saveUser(loggedInUser);
                StorageService.setCurrentUser(loggedInUser);
                return { success: true, user: loggedInUser };
            }
        } catch (e) {
            console.warn('Backend login unavailable; checking local users storage.');
        }

        // 2. Fallback to local storage
        const users = StorageService.getRegisteredUsers();
        const user = users.find(u => u.email.toLowerCase() === trimmedEmail && u.password === password);

        if (!user) {
            return { success: false, errors: ['Invalid email or password. Please check your credentials or create a new account.'] };
        }

        StorageService.setCurrentUser(user);
        return { success: true, user };
    },

    /**
     * Quick demo login with pre-configured student profile
     */
    async loginDemo() {
        let demoUser = StorageService.getRegisteredUsers().find(u => u.email === 'demo@college.edu');
        if (!demoUser) {
            demoUser = {
                id: 'demo_user_1',
                fullName: 'Priyatham kumar',
                email: 'demo@college.edu',
                password: 'password123',
                role: '2nd Year B.Tech Student',
                createdAt: new Date().toISOString()
            };
            StorageService.saveUser(demoUser);
        }

        try {
            await fetch('/api/auth/demo', { method: 'POST' });
        } catch (e) {}

        StorageService.setCurrentUser(demoUser);
        return { success: true, user: demoUser };
    },

    /**
     * Update student profile details
     */
    async updateProfile(fullName, email, role, password = '') {
        const errors = [];
        if (!fullName || fullName.trim().length < 2) {
            errors.push('Full name must be at least 2 characters.');
        }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            errors.push('Please provide a valid email address.');
        }
        if (password && password.length < 6) {
            errors.push('Password must be at least 6 characters if changing.');
        }

        if (errors.length > 0) {
            return { success: false, errors };
        }

        const currentUser = this.getUser() || {};
        const updatedUser = {
            ...currentUser,
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            role: role ? role.trim() : (currentUser.role || '2nd Year B.Tech Student')
        };
        if (password) {
            updatedUser.password = password;
        }

        // Update local storage
        StorageService.setCurrentUser(updatedUser);
        const users = StorageService.getRegisteredUsers();
        const idx = users.findIndex(u => u.email && u.email.toLowerCase() === (currentUser.email || '').toLowerCase());
        if (idx !== -1) {
            users[idx] = updatedUser;
            StorageService.set('credit_engine_registered_users', users);
        } else {
            StorageService.saveUser(updatedUser);
        }

        // Sync with MongoDB backend
        try {
            await fetch('/api/auth/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentEmail: currentUser.email,
                    fullName: updatedUser.fullName,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    password: password || undefined
                })
            });
        } catch (e) {
            console.warn('Backend profile update offline fallback active');
        }

        this.syncAuthUI();
        return { success: true, user: updatedUser };
    },

    /**
     * Logout and redirect to sign up / login page
     */
    logout() {
        StorageService.clearSession();
        window.location.href = 'login.html';
    },

    /**
     * Update navigation state based on auth status
     */
    syncAuthUI() {
        const user = StorageService.getCurrentUser();
        const userDisplayElems = document.querySelectorAll('.auth-user-name');
        const userRoleElems = document.querySelectorAll('.auth-user-role');
        const userEmailElems = document.querySelectorAll('.auth-user-email');
        const authStatusElems = document.querySelectorAll('.auth-status-badge');
        const userAvatarElems = document.querySelectorAll('.user-avatar');

        if (user) {
            const fullName = user.fullName || 'Student';
            const initials = fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'ST';

            userDisplayElems.forEach(el => { el.textContent = fullName; });
            userAvatarElems.forEach(el => { el.textContent = initials; });
            userRoleElems.forEach(el => { el.textContent = user.role || '2nd Year B.Tech Student'; });
            userEmailElems.forEach(el => { el.textContent = user.email; });
            authStatusElems.forEach(el => { el.textContent = 'Account Active ✅'; });
        } else {
            userDisplayElems.forEach(el => { el.textContent = 'Guest (Sign In Required)'; });
            userAvatarElems.forEach(el => { el.textContent = '👤'; });
            userRoleElems.forEach(el => { el.textContent = 'Guest User'; });
            userEmailElems.forEach(el => { el.textContent = 'Not logged in'; });
            authStatusElems.forEach(el => { el.textContent = 'Sign Up Required'; });
        }

        // Dynamic Nav Actions for public pages
        const publicNavActions = document.querySelector('.public-navbar .nav-actions');
        if (publicNavActions) {
            if (user) {
                publicNavActions.innerHTML = `
                    <span style="font-size: 0.85rem; color: #a5b4fc; font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                        ${user.fullName.split(' ')[0]}
                    </span>
                    <a href="dashboard.html" class="btn btn-primary btn-sm">Open Dashboard</a>
                    <button class="btn btn-outline-light btn-sm btn-logout" style="padding: 0.4rem 0.75rem;">Logout</button>
                `;
            } else {
                publicNavActions.innerHTML = `
                    <a href="login.html" class="btn btn-outline-light btn-sm">Login</a>
                    <a href="register.html" class="btn btn-primary btn-sm">✨ Sign Up</a>
                `;
            }
        }

        // Add logout triggers
        document.querySelectorAll('.btn-logout').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                AuthService.logout();
            });
        });
    }
};

// Auto sync auth elements on DOM ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        AuthService.syncAuthUI();
    });
}

if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
}
