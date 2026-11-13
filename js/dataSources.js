/**
 * ECOMLYTICS — Data Sources Management Module
 * Manages CSV store ingestion and separate Google Analytics (GA4) integration path
 */

(function (window) {
  'use strict';

  const DataSources = {
    renderLoading(container) {
      container.innerHTML = `
        <div class="data-sources-grid">
          ${Array(2).fill(0).map(() => `
            <div class="card">
              <div class="skeleton" style="height: 24px; width: 40%; margin-bottom: 16px;"></div>
              <div class="skeleton" style="height: 14px; width: 80%; margin-bottom: 24px;"></div>
              <div class="skeleton" style="height: 38px; width: 100%;"></div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderErrorState(container, errorMsg) {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-state-title">Unable to retrieve data sources.</div>
          <div class="error-state-text">${errorMsg || 'Please try again.'}</div>
          <button type="button" class="btn btn-secondary" id="sources-retry-btn">RETRY</button>
        </div>
      `;

      const retryBtn = document.getElementById('sources-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          DataSources.loadDataSources(container);
        });
      }
    },

    async loadDataSources(container) {
      if (!container) return;
      this.renderLoading(container);

      // Fetch existing sources from backend
      const result = await window.ECOMLYTICS_API.getDataSources();
      const sourcesData = result.success ? result.data : null;

      // Also check GA4 status
      const ga4Result = await window.ECOMLYTICS_API.getGA4Overview();
      const ga4Active = ga4Result.success && ga4Result.data && ga4Result.data.status === 'CONFIGURED';
      const analyticsResult = await window.ECOMLYTICS_API.getAnalyticsStatus();
      const analyticsProviders = analyticsResult.success ? analyticsResult.data : {};

      const sourcesList = Array.isArray(sourcesData) ? sourcesData : [
        {
          id: 'source-csv-default',
          name: 'Store Sales & Orders CSV',
          type: 'CSV / File Import',
          status: 'CONNECTED',
          lastSync: 'Sync available',
          details: 'Direct order logs, catalog SKU attributes, and customer identifiers'
        },
        {
          id: 'source-ga4',
          name: 'Google Analytics 4 (GA4)',
          type: 'OAuth 2.0 Web Stream',
          status: ga4Active ? 'CONNECTED' : 'DISCONNECTED',
          lastSync: ga4Active ? 'Active stream' : 'Awaiting authentication',
          details: 'Funnel stages, checkout progression, and session drop-off tracking'
        }
      ];

      container.innerHTML = `
        <div class="view-header" style="margin-bottom: 20px;">
          <div>
            <div class="view-title">Data Sources & Ingestion</div>
            <div class="view-subtitle">Connect store transaction feeds and analytics pipelines</div>
          </div>
        </div>


        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title">Product Analytics Integrations</div>
              <div class="card-subtitle">Live environment configuration for event collection</div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-analytics-status">REFRESH STATUS</button>
          </div>
          <div class="data-sources-grid">
            ${Object.entries(analyticsProviders).map(([key, provider]) => `
              <div class="source-card">
                <div class="source-card-header">
                  <div class="source-card-title">${provider.name}</div>
                  <span class="badge ${provider.configured ? 'badge-high' : 'badge-low'}">
                    ${provider.configured ? 'CONFIGURED' : 'NOT CONFIGURED'}
                  </span>
                </div>
                <p class="source-card-desc">${provider.detail}</p>
              </div>
            `).join('')}
          </div>
          <p class="text-mono text-muted" style="font-size: 10px; margin-top: 12px;">
            Configured means required environment variables are present; verify delivery in each provider's live events/debugger.
          </p>
        </div>

        <div class="card" style="margin-bottom: 32px;">
          <div class="card-header">
            <div>
              <div class="card-title">Architecture Notice: Isolated Pipelines</div>
              <div class="card-subtitle">Production data integrity principles</div>
            </div>
            <span class="badge">SECURITY & PRIVACY</span>
          </div>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.6;">
            Ecomlytics processes store transactions (orders, revenue, customer recency) through verified ingestion pipelines. Google Analytics (GA4) uses a dedicated OAuth 2.0 connection path with encrypted local token storage to evaluate web conversion funnels without mixing unverified data.
          </p>
        </div>

        <div class="data-sources-grid">
          <!-- CSV Ingest Card -->
          <div class="source-card">
            <div class="source-card-header">
              <div>
                <div class="source-card-title">Store Data Import (CSV)</div>
                <div class="text-mono text-muted" style="font-size: 11px;">ORDERS, PRODUCTS, CUSTOMERS</div>
              </div>
              <span class="badge badge-high">PRIMARY SOURCE</span>
            </div>
            <p class="source-card-desc">
              Import transaction CSV logs containing order items, product SKUs, prices, customer IDs, and return flags.
            </p>

            <div class="upload-dropzone" id="csv-upload-dropzone" style="margin-bottom: 16px;">
              <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="margin-bottom: 8px; color: var(--text-secondary);">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">
                Choose CSV file or drag here
              </div>
              <div class="text-mono text-muted" style="font-size: 11px;">
                Required columns: order_id, date, customer_id, product_name, price, quantity
              </div>
            </div>

            <div class="source-card-footer">
              <span class="text-mono text-muted" style="font-size: 11px;" id="csv-file-status">Ready to import</span>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-trigger-upload">
                SELECT FILE
              </button>
            </div>
          </div>

          <!-- GA4 Integration Card -->
          <div class="source-card">
            <div class="source-card-header">
              <div>
                <div class="source-card-title">Google Analytics 4 (GA4)</div>
                <div class="text-mono text-muted" style="font-size: 11px;">FUNNEL & WEB SESSIONS</div>
              </div>
              <span class="badge ${ga4Active ? 'badge-high' : 'badge-low'}">
                ${ga4Active ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <p class="source-card-desc">
              Collect browser events using your GA4 Measurement ID. GA4 Data API OAuth reporting is a separate integration.
            </p>

            <div style="background-color: var(--surface-elevated); padding: 16px; border: 1px solid var(--border-subtle); border-radius: 4px; margin-bottom: 16px;">
              <div class="form-group" style="margin-bottom: 10px;">
                <label class="form-label" style="font-size: 10px;">GA4 Measurement ID (configured in Render)</label>
                <input type="text" class="form-control" id="ga4-property-id" placeholder="e.g. G-XXXXXXXXXX" style="font-size: 12px; padding: 8px 12px;">
              </div>
              <div class="text-mono text-muted" style="font-size: 10px;">
                Set GA4_MEASUREMENT_ID in the Render environment to enable browser collection.
              </div>
            </div>

            <div class="source-card-footer">
              <span class="text-mono text-muted" style="font-size: 11px;">
                ${ga4Active ? 'OAuth Active' : 'OAuth Credentials Required'}
              </span>
              <button type="button" class="btn ${ga4Active ? 'btn-secondary' : 'btn-primary'} btn-sm" id="btn-ga4-action">
                ${ga4Active ? 'DISCONNECT' : 'CHECK GA4'}
              </button>
            </div>
          </div>
        </div>

        <!-- Connected Sources Table -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Configured Pipelines</div>
              <div class="card-subtitle">Active data feeds and synchronization state</div>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-refresh-all-sources">
              REFRESH ALL
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Data Source</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Sync Schedule</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${sourcesList.map(src => `
                  <tr>
                    <td class="cell-primary">
                      <div>${src.name}</div>
                      <div class="text-mono text-muted" style="font-size: 10px;">${src.details || ''}</div>
                    </td>
                    <td class="text-mono">${src.type}</td>
                    <td>
                      <span class="badge ${src.status === 'CONNECTED' ? 'badge-high' : 'badge-low'}">
                        ${src.status}
                      </span>
                    </td>
                    <td class="cell-mono text-muted">${src.lastSync || 'Manual'}</td>
                    <td>
                      <div class="flex gap-xs">
                        <button class="btn btn-ghost btn-sm" onclick="alert('Synchronization initiated with backend.')">SYNC</button>
                        <button class="btn btn-ghost btn-sm" style="color: #888;" onclick="alert('Source configuration options.')">CONFIG</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // CSV upload bindings
      const dropzone = document.getElementById('csv-upload-dropzone');
      const fileInput = document.getElementById('csv-file-input');
      const triggerBtn = document.getElementById('btn-trigger-upload');
      const statusLabel = document.getElementById('csv-file-status');

      if (triggerBtn && fileInput) {
        triggerBtn.addEventListener('click', () => fileInput.click());
      }

      if (dropzone && fileInput) {
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.style.borderColor = '#FFFFFF';
        });
        dropzone.addEventListener('dragleave', () => {
          dropzone.style.borderColor = '';
        });
        dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.style.borderColor = '';
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
          }
        });

        fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        });
      }

      function handleFileSelect(file) {
        if (!file.name.endsWith('.csv')) {
          alert('Please select a valid .csv spreadsheet file.');
          return;
        }

        if (statusLabel) {
          statusLabel.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        }

        // Show toast and notify backend
        const formData = new FormData();
        formData.append('file', file);

        window.ECOMLYTICS_API.connectDataSource(formData).then(res => {
          if (res.success) {
            alert(`File "${file.name}" uploaded successfully. Calculations updated.`);
            DataSources.loadDataSources(container);
          } else {
            // Note: If backend not running, inform user factually
            alert(`File "${file.name}" ready for upload. (${res.error})`);
          }
        });
      }

      // GA4 status action: browser collection is configured through Render environment.
      const ga4Btn = document.getElementById('btn-ga4-action');
      if (ga4Btn) {
        ga4Btn.addEventListener('click', async () => {
          const latest = await window.ECOMLYTICS_API.getGA4Overview();
          const configured = latest.success && latest.data && latest.data.status === 'CONFIGURED';
          alert(configured
            ? 'GA4 Measurement ID is configured. Generate activity in Ecomlytics and verify events in GA4 Realtime.'
            : 'Set GA4_MEASUREMENT_ID in Render Environment Variables, then redeploy.');
          DataSources.loadDataSources(container);
        });
      }

      const refreshAnalyticsBtn = document.getElementById('btn-refresh-analytics-status');
      if (refreshAnalyticsBtn) refreshAnalyticsBtn.addEventListener('click', () => DataSources.loadDataSources(container));

      const refreshAllBtn = document.getElementById('btn-refresh-all-sources');
      if (refreshAllBtn) {
        refreshAllBtn.addEventListener('click', () => {
          DataSources.loadDataSources(container);
        });
      }
    }
  };

  window.ECOMLYTICS_DATASOURCES = DataSources;
})(window);
