/**
 * ============================================================================
 * Storage Service - LocalStorage & MongoDB Sync
 * ============================================================================
 * Manages client persistence and synchronizes records with MongoDB database
 * via ApiService when connected.
 */

import { ApiService } from './api.js';

const STORAGE_KEYS = {
    USER_SESSION: 'credit_engine_user_session',
    USERS_DB: 'credit_engine_registered_users',
    CURRENT_PROFILE: 'credit_engine_current_profile',
    SCORE_HISTORY: 'credit_engine_score_history',
    APP_SETTINGS: 'credit_engine_settings'
};

export const StorageService = {
    /**
     * Get parsed JSON from localStorage with fallback
     */
    get(key, fallback = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            console.error(`Error reading ${key} from localStorage:`, e);
            return fallback;
        }
    },

    /**
     * Store stringified JSON in localStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Error writing ${key} to localStorage:`, e);
            return false;
        }
    },

    /**
     * Remove specific key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error(`Error removing ${key} from localStorage:`, e);
        }
    },

    // -------------------------------------------------------------
    // Current Active Financial Profile
    // -------------------------------------------------------------
    getCurrentProfile() {
        return this.get(STORAGE_KEYS.CURRENT_PROFILE, null);
    },

    async saveCurrentProfile(profileData) {
        this.set(STORAGE_KEYS.CURRENT_PROFILE, profileData);
        // Async background sync with MongoDB
        const user = this.getCurrentUser();
        ApiService.saveProfile(profileData, user ? user.email : 'demo@college.edu');
        return true;
    },

    // -------------------------------------------------------------
    // Score History Management (Hybrid localStorage + MongoDB)
    // -------------------------------------------------------------
    getScoreHistory() {
        const history = this.get(STORAGE_KEYS.SCORE_HISTORY, []);
        if (!Array.isArray(history)) return [];
        return history;
    },

    async addScoreHistoryEntry(entry) {
        const history = this.getScoreHistory();
        const user = this.getCurrentUser();
        const newEntry = {
            id: 'rec_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            timestamp: new Date().toISOString(),
            formattedDate: new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            userEmail: user ? user.email : 'demo@college.edu',
            ...entry
        };

        // Prepend locally
        history.unshift(newEntry);
        this.set(STORAGE_KEYS.SCORE_HISTORY, history);

        // Sync with MongoDB in background
        ApiService.addHistory(newEntry);

        return newEntry;
    },

    async deleteScoreHistoryEntry(id) {
        const history = this.getScoreHistory();
        const filtered = history.filter(item => item.id !== id && item._id !== id);
        this.set(STORAGE_KEYS.SCORE_HISTORY, filtered);

        // Delete from MongoDB
        ApiService.deleteHistory(id);

        return filtered;
    },

    async clearAllHistory() {
        this.set(STORAGE_KEYS.SCORE_HISTORY, []);
        // Clear in MongoDB
        ApiService.clearHistory();
        return [];
    },

    // -------------------------------------------------------------
    // User & Session Management
    // -------------------------------------------------------------
    getRegisteredUsers() {
        return this.get(STORAGE_KEYS.USERS_DB, []);
    },

    saveUser(user) {
        const users = this.getRegisteredUsers();
        users.push(user);
        this.set(STORAGE_KEYS.USERS_DB, users);
    },

    getCurrentUser() {
        return this.get(STORAGE_KEYS.USER_SESSION, null);
    },

    setCurrentUser(user) {
        this.set(STORAGE_KEYS.USER_SESSION, user);
    },

    clearSession() {
        this.remove(STORAGE_KEYS.USER_SESSION);
    },

    // -------------------------------------------------------------
    // Initializer / Demo Seeder
    // -------------------------------------------------------------
    initDemoSeed() {
        const users = this.getRegisteredUsers();
        if (users.length === 0) {
            const defaultUser = {
                id: 'demo_user_1',
                fullName: 'Priyatham kumar (Demo Student)',
                email: 'demo@college.edu',
                password: 'password123',
                role: '2nd Year B.Tech Student',
                createdAt: new Date().toISOString()
            };
            this.saveUser(defaultUser);
        }

        if (!this.getCurrentProfile()) {
            const demoResult = {
                inputs: {
                    monthlyIncome: 50000,
                    totalRepayments: 10,
                    onTimeRepayments: 9,
                    existingDebt: 100000,
                    repaymentPercentage: 90
                },
                scores: {
                    incomeScore: 80,
                    repaymentScore: 90,
                    debtScore: 70,
                    weightedIncome: 24,
                    weightedRepayment: 45,
                    weightedDebt: 14,
                    finalScore: 83
                },
                rating: {
                    label: 'GOOD',
                    min: 80,
                    max: 100,
                    class: 'rating-good',
                    color: '#10b981',
                    desc: 'Favorable educational profile'
                },
                breakdown: {
                    incomeFormula: '80 × 30% = 24',
                    repaymentFormula: '90% × 50% = 45',
                    debtFormula: '70 × 20% = 14',
                    finalFormula: '24 + 45 + 14 = 83'
                },
                timestamp: new Date().toISOString(),
                source: 'Demo Preset'
            };
            this.saveCurrentProfile(demoResult);

            if (this.getScoreHistory().length === 0) {
                this.addScoreHistoryEntry({
                    type: 'Calculation',
                    note: 'Baseline Educational Profile (Demo)',
                    ...demoResult
                });
            }
        }
    }
};

// Initialize seed on load
StorageService.initDemoSeed();

// Attach globally
if (typeof window !== 'undefined') {
    window.StorageService = StorageService;
}
