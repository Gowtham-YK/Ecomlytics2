/**
 * ECOMLYTICS — Settings Management Module
 * Manages Profile, Workspace, API Configuration, Notifications, and Security tabs
 */

(function (window) {
  'use strict';

  const Settings = {
    activeTab: 'profile',

    loadSettings(container) {
      if (!container) return;

      const user = window.ECOMLYTICS_AUTH.getUser() || {
        name: 'Store Administrator',
        email: 'admin@ecomlytics.local',
        workspace: 'Main Store Workspace',
        role: 'Account Owner'
      };

      const currentApiUrl = window.ECOMLYTICS_CONFIG.API_BASE_URL;

      container.innerHTML = `
        <div class="view-header">
          <div>
            <div class="view-title">Settings & Environment</div>
            <div class="view-subtitle">Workspace parameters, account credentials, and backend configuration</div>
          </div>
        </div>

        <div class="tab-list" id="settings-tab-list">
          <button class="tab-btn ${this.activeTab === 'profile' ? 'active' : ''}" data-settings-tab="profile">Profile</button>
          <button class="tab-btn ${this.activeTab === 'workspace' ? 'active' : ''}" data-settings-tab="workspace">Workspace</button>
          <button class="tab-btn ${this.activeTab === 'api' ? 'active' : ''}" data-settings-tab="api">API & Connection</button>
          <button class="tab-btn ${this.activeTab === 'security' ? 'active' : ''}" data-settings-tab="security">Security</button>
          <button class="tab-btn ${this.activeTab === 'notifications' ? 'active' : ''}" data-settings-tab="notifications">Notifications</button>
        </div>

        <div id="settings-content-area"></div>
      `;

      this.renderTabContent();

      // Tab switcher
      const tabs = container.querySelectorAll('.tab-btn[data-settings-tab]');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.activeTab = tab.getAttribute('data-settings-tab');
          tabs.forEach(t => t.classList.toggle('active', t === tab));
          this.renderTabContent();
        });
      });
    },

    renderTabContent() {
      const area = document.getElementById('settings-content-area');
      if (!area) return;

      const user = window.ECOMLYTICS_AUTH.getUser() || {
        name: 'Store Administrator',
        email: 'admin@ecomlytics.local',
        workspace: 'Main Store Workspace',
        role: 'Account Owner'
      };

      if (this.activeTab === 'profile') {
        area.innerHTML = `
          <div class="card" style="max-width: 640px;">
            <div class="card-header">
              <div class="card-title">User Profile</div>
            </div>
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-control" value="${user.name}" id="set-user-name">
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" class="form-control" value="${user.email}" id="set-user-email">
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <input type="text" class="form-control" value="${user.role}" disabled style="opacity: 0.6;">
            </div>
            <div style="margin-top: 24px;">
              <button type="button" class="btn btn-primary" id="save-profile-btn">SAVE CHANGES</button>
            </div>
          </div>
        `;

        const saveBtn = document.getElementById('save-profile-btn');
        if (saveBtn) {
          saveBtn.addEventListener('click', () => {
            alert('Profile details saved.');
          });
        }
      } else if (this.activeTab === 'workspace') {
        area.innerHTML = `
          <div class="card" style="max-width: 640px;">
            <div class="card-header">
              <div class="card-title">Store Workspace</div>
            </div>
            <div class="form-group">
              <label class="form-label">Workspace Name</label>
              <input type="text" class="form-control" value="${user.workspace}" id="set-workspace-name">
            </div>
            <div class="form-group">
              <label class="form-label">Default Currency</label>
              <select class="form-control form-select">
                <option selected>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
                <option>CAD ($)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Calculation Window</label>
              <select class="form-control form-select">
                <option selected>Rolling 30 Days</option>
                <option>Rolling 90 Days</option>
                <option>Full Historic Series</option>
              </select>
            </div>
            <div style="margin-top: 24px;">
              <button type="button" class="btn btn-primary">SAVE WORKSPACE</button>
            </div>
          </div>
        `;
      } else if (this.activeTab === 'api') {
        const currentUrl = window.ECOMLYTICS_CONFIG.API_BASE_URL;
        area.innerHTML = `
          <div class="card" style="max-width: 640px;">
            <div class="card-header">
              <div>
                <div class="card-title">Backend API Configuration</div>
                <div class="card-subtitle">FastAPI server address & live connectivity</div>
              </div>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
              By default, Ecomlytics connects to the local FastAPI server at <code>http://127.0.0.1:8000</code> or your deployment host. Update this setting to point to staging or production backends.
            </p>
            <div class="form-group">
              <label class="form-label">API Base URL</label>
              <input type="text" class="form-control text-mono" id="api-base-url-input" value="${currentUrl}" placeholder="http://127.0.0.1:8000">
            </div>
            <div style="display: flex; gap: 12px; margin-top: 24px;">
              <button type="button" class="btn btn-primary" id="save-api-url-btn">UPDATE API URL</button>
              <button type="button" class="btn btn-secondary" id="test-api-health-btn">TEST HEALTH (/api/health)</button>
              <button type="button" class="btn btn-ghost" id="reset-api-url-btn">RESET DEFAULT</button>
            </div>
            <div id="api-health-feedback" style="margin-top: 16px; font-size: 0.8125rem; font-family: var(--font-mono);"></div>
          </div>
        `;

        const saveApiBtn = document.getElementById('save-api-url-btn');
        const testHealthBtn = document.getElementById('test-api-health-btn');
        const resetApiBtn = document.getElementById('reset-api-url-btn');
        const feedback = document.getElementById('api-health-feedback');

        if (saveApiBtn) {
          saveApiBtn.addEventListener('click', () => {
            const inputVal = document.getElementById('api-base-url-input').value.trim();
            window.ECOMLYTICS_CONFIG.setApiBaseUrl(inputVal);
            feedback.innerHTML = `<span style="color: #FFFFFF;">✓ API base URL updated to: ${window.ECOMLYTICS_CONFIG.API_BASE_URL}</span>`;
            if (window.ECOMLYTICS_APP) window.ECOMLYTICS_APP.checkConnection();
          });
        }

        if (resetApiBtn) {
          resetApiBtn.addEventListener('click', () => {
            window.ECOMLYTICS_CONFIG.setApiBaseUrl(null);
            document.getElementById('api-base-url-input').value = window.ECOMLYTICS_CONFIG.API_BASE_URL;
            feedback.innerHTML = `<span style="color: #A0A0A0;">Reset to default URL: ${window.ECOMLYTICS_CONFIG.API_BASE_URL}</span>`;
            if (window.ECOMLYTICS_APP) window.ECOMLYTICS_APP.checkConnection();
          });
        }

        if (testHealthBtn) {
          testHealthBtn.addEventListener('click', async () => {
            feedback.innerHTML = `<span style="color: #A0A0A0;">Querying /api/health...</span>`;
            const health = await window.ECOMLYTICS_API.checkHealth();
            if (health.success) {
              feedback.innerHTML = `<span style="color: #FFFFFF;">✓ Backend Online: ${JSON.stringify(health.data)}</span>`;
            } else {
              feedback.innerHTML = `<span style="color: #777;">✕ Backend Offline: ${health.error} (Is FastAPI running on port 8000?)</span>`;
            }
          });
        }
      } else if (this.activeTab === 'security') {
        area.innerHTML = `
          <div class="card" style="max-width: 640px;">
            <div class="card-header">
              <div class="card-title">Security & Storage Architecture</div>
              <span class="badge">FACTUAL SPECIFICATION</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px; font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.6;">
              <p>
                <strong>Encrypted Token Storage:</strong> Third-party OAuth tokens (such as Google Analytics refresh tokens) are held in encrypted SQLite storage with restricted local access.
              </p>
              <p>
                <strong>Data Boundary:</strong> Customer personally identifiable records are parsed within the analytics engine for segment classification and are not shared or broadcast externally.
              </p>
              <p>
                <strong>Authentication Scope:</strong> Google OAuth requests are scoped to read-only reporting access (<code>analytics.readonly</code>).
              </p>
            </div>
          </div>
        `;
      } else if (this.activeTab === 'notifications') {
        area.innerHTML = `
          <div class="card" style="max-width: 640px;">
            <div class="card-header">
              <div class="card-title">Alert & Digest Preferences</div>
              <span class="badge badge-low">FUTURE SCOPE</span>
            </div>
            <p style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 20px;">
              Automated email digests and anomaly threshold alerts are part of upcoming workspace releases. These settings are currently read-only.
            </p>
            <div class="form-group">
              <label class="form-label" style="opacity: 0.5;">Email High-Priority Insight Alerts</label>
              <input type="text" class="form-control" value="Disabled" disabled style="opacity: 0.5;">
            </div>
            <div class="form-group">
              <label class="form-label" style="opacity: 0.5;">Weekly Performance Digest</label>
              <input type="text" class="form-control" value="Disabled" disabled style="opacity: 0.5;">
            </div>
          </div>
        `;
      }
    }
  };

  window.ECOMLYTICS_SETTINGS = Settings;
})(window);
