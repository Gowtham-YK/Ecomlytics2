/**
 * ECOMLYTICS — Authentication & Account Flow Management
 * Manages user credentials, onboarding progress, and session states
 */

(function (window) {
  'use strict';

  const AUTH_KEY = 'ecomlytics_auth_session';
  const TOKEN_KEY = 'ecomlytics_auth_token';

  const Auth = {
    /**
     * Check if user currently has an active session
     */
    isAuthenticated() {
      const session = this.getSession();
      return !!(session && session.token);
    },

    /**
     * Retrieve active session
     */
    getSession() {
      try {
        const item = localStorage.getItem(AUTH_KEY);
        return item ? JSON.parse(item) : null;
      } catch (_) {
        return null;
      }
    },

    /**
     * Get active user object
     */
    getUser() {
      const session = this.getSession();
      return session ? session.user : null;
    },

    /**
     * Perform login
     */
    async login(email, password) {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      // In production, posts to backend /api/auth/login or OAuth endpoint
      // Simulate client session generation
      const sessionData = {
        token: 'ey-ecomlytics-' + Math.random().toString(36).substring(2) + Date.now(),
        user: {
          email: email,
          name: email.split('@')[0],
          workspace: 'Main Store Workspace',
          role: 'Store Owner',
          created: new Date().toISOString()
        }
      };

      localStorage.setItem(AUTH_KEY, JSON.stringify(sessionData));
      localStorage.setItem(TOKEN_KEY, sessionData.token);
      return { success: true, session: sessionData };
    },

    /**
     * Perform signup / registration
     */
    async signup(name, email, password, storeName) {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      const sessionData = {
        token: 'ey-ecomlytics-' + Math.random().toString(36).substring(2) + Date.now(),
        user: {
          name: name || email.split('@')[0],
          email: email,
          workspace: storeName || 'My E-Commerce Store',
          role: 'Administrator',
          created: new Date().toISOString(),
          isNewAccount: true
        }
      };

      localStorage.setItem(AUTH_KEY, JSON.stringify(sessionData));
      localStorage.setItem(TOKEN_KEY, sessionData.token);
      return { success: true, session: sessionData };
    },

    /**
     * Request password reset
     */
    async forgotPassword(email) {
      if (!email) {
        return { success: false, error: 'Please enter your account email address.' };
      }
      return { 
        success: true, 
        message: 'Password reset link sent to ' + email + ' (if an account exists).' 
      };
    },

    /**
     * Log out current user
     */
    logout() {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = 'index.html';
    }
  };

  window.ECOMLYTICS_AUTH = Auth;
})(window);
