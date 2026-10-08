/**
 * ============================================================================
 * API Service Bridge - Frontend & MongoDB Integration
 * ============================================================================
 * Connects frontend controllers to the Express & MongoDB REST API backend
 * with automatic fallback to localStorage when running in static/offline mode.
 */

const API_BASE = '/api';

export const ApiService = {
    isServerActive: false,
    isMongoConnected: false,

    /**
     * Check backend and MongoDB connection status
     */
    async checkStatus() {
        try {
            const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                this.isServerActive = true;
                this.isMongoConnected = data.mongoConnected;
                this.updateDatabaseStatusBadge();
                return { active: true, mongo: data.mongoConnected };
            }
        } catch (e) {
            this.isServerActive = false;
            this.isMongoConnected = false;
        }
        this.updateDatabaseStatusBadge();
        return { active: false, mongo: false };
    },

    /**
     * Updates visual database connection badge across application headers
     */
    updateDatabaseStatusBadge() {
        const badges = document.querySelectorAll('.db-status-badge');
        badges.forEach(badge => {
            if (this.isMongoConnected) {
                badge.innerHTML = '🟢 MongoDB Connected';
                badge.className = 'badge rating-badge rating-good db-status-badge';
                badge.title = 'Active MongoDB Database Connection';
            } else if (this.isServerActive) {
                badge.innerHTML = '🟡 Local Mode (MongoDB Offline)';
                badge.className = 'badge rating-badge rating-average db-status-badge';
                badge.title = 'Express Server active; using localStorage for storage';
            } else {
                badge.innerHTML = '⚪ Client-Side Mode';
                badge.className = 'badge badge-edu db-status-badge';
                badge.title = 'Running directly via browser localStorage';
            }
        });
    },

    // -------------------------------------------------------------
    // History MongoDB Endpoints
    // -------------------------------------------------------------
    async getHistory() {
        if (!this.isServerActive) return null;
        try {
            const res = await fetch(`${API_BASE}/history`);
            if (res.ok) {
                const data = await res.json();
                return data.isMongo ? data.history : null;
            }
        } catch (e) {
            console.warn('API getHistory fallback to localStorage');
        }
        return null;
    },

    async addHistory(record) {
        if (!this.isServerActive) return null;
        try {
            const res = await fetch(`${API_BASE}/history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record)
            });
            if (res.ok) {
                const data = await res.json();
                return data.record;
            }
        } catch (e) {
            console.warn('API addHistory fallback');
        }
        return null;
    },

    async deleteHistory(id) {
        if (!this.isServerActive) return false;
        try {
            const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    async clearHistory() {
        if (!this.isServerActive) return false;
        try {
            const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
            return res.ok;
        } catch (e) {
            return false;
        }
    },

    // -------------------------------------------------------------
    // Profile MongoDB Endpoints
    // -------------------------------------------------------------
    async getProfile(email) {
        if (!this.isServerActive) return null;
        try {
            const res = await fetch(`${API_BASE}/profile?email=${encodeURIComponent(email || 'demo@college.edu')}`);
            if (res.ok) {
                const data = await res.json();
                return data.isMongo ? data.profile : null;
            }
        } catch (e) {
            console.warn('API getProfile fallback');
        }
        return null;
    },

    async saveProfile(profileData, email) {
        if (!this.isServerActive) return null;
        try {
            const res = await fetch(`${API_BASE}/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileData, email })
            });
            if (res.ok) {
                const data = await res.json();
                return data.profile;
            }
        } catch (e) {
            console.warn('API saveProfile fallback');
        }
        return null;
    }
};

// Auto check backend on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        ApiService.checkStatus();
    });
}

if (typeof window !== 'undefined') {
    window.ApiService = ApiService;
}
