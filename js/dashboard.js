/**
 * ECOMLYTICS — Dashboard Overview Module
 * Handles loading, rendering, empty states, and error handling for /api/overview
 */

(function (window) {
  'use strict';

  const Dashboard = {
    currentPeriod: '30d',

    /**
     * Render skeleton loaders in the overview container
     */
    renderLoading(container) {
      container.innerHTML = `
        <div class="metrics-grid-4">
          ${Array(4).fill(0).map(() => `
            <div class="metric-card">
              <div class="skeleton" style="height: 12px; width: 50%;"></div>
              <div class="skeleton" style="height: 32px; width: 75%; margin: 12px 0;"></div>
              <div class="skeleton" style="height: 12px; width: 40%;"></div>
            </div>
          `).join('')}
        </div>
        <div class="metrics-grid-4">
          ${Array(4).fill(0).map(() => `
            <div class="metric-card">
              <div class="skeleton" style="height: 12px; width: 50%;"></div>
              <div class="skeleton" style="height: 32px; width: 75%; margin: 12px 0;"></div>
              <div class="skeleton" style="height: 12px; width: 40%;"></div>
            </div>
          `).join('')}
        </div>
        <div class="metrics-grid-2col">
          <div class="card">
            <div class="skeleton" style="height: 20px; width: 30%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 180px; width: 100%;"></div>
          </div>
          <div class="card">
            <div class="skeleton" style="height: 20px; width: 30%; margin-bottom: 20px;"></div>
            <div class="skeleton" style="height: 180px; width: 100%;"></div>
          </div>
        </div>
      `;
    },

    /**
     * Render empty state when backend returns no data or store has no connected sources
     */
    renderEmptyState(container, message) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          <div class="empty-state-title">No sales data available yet.</div>
          <div class="empty-state-text">
            ${message || 'Connect a data source to begin analyzing your store.'}
          </div>
          <button type="button" class="btn btn-primary" id="overview-connect-data-btn">
            CONNECT DATA SOURCE
          </button>
        </div>
      `;

      const connectBtn = document.getElementById('overview-connect-data-btn');
      if (connectBtn) {
        connectBtn.addEventListener('click', () => {
          if (window.ECOMLYTICS_APP) {
            window.ECOMLYTICS_APP.switchView('data-sources');
          }
        });
      }
    },

    /**
     * Render error state when API request fails
     */
    renderErrorState(container, errorMsg) {
      container.innerHTML = `
        <div class="error-state">
          <svg class="error-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div class="error-state-title">Unable to load overview data.</div>
          <div class="error-state-text">
            ${errorMsg || 'Please try again.'}
          </div>
          <button type="button" class="btn btn-secondary" id="overview-retry-btn">
            RETRY
          </button>
        </div>
      `;

      const retryBtn = document.getElementById('overview-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          Dashboard.loadOverview(container);
        });
      }
    },

    /**
     * Format currency helper
     */
    formatCurrency(amount) {
      if (amount === null || amount === undefined || isNaN(amount)) return '—';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    },

    /**
     * Format number helper
     */
    formatNumber(num) {
      if (num === null || num === undefined || isNaN(num)) return '—';
      return new Intl.NumberFormat('en-US').format(num);
    },

    /**
     * Format percent helper
     */
    formatPercent(val) {
      if (val === null || val === undefined || isNaN(val)) return '—';
      return `${(val * 100).toFixed(1)}%`;
    },

    /**
     * Fetch overview from API and render
     */
    async loadOverview(container) {
      if (!container) return;
      this.renderLoading(container);

      const result = await window.ECOMLYTICS_API.getOverview({ period: this.currentPeriod });

      if (!result.success) {
        this.renderErrorState(container, result.error);
        return;
      }

      const data = result.data;

      // If backend returned empty or zero records
      if (!data || Object.keys(data).length === 0 || (data.orders === 0 && data.revenue === 0)) {
        this.renderEmptyState(container);
        return;
      }

      // Populate valid data from backend
      container.innerHTML = `
        <div class="metrics-grid-4">
          <div class="metric-card">
            <div class="metric-label">
              <span>Total Revenue</span>
              <span class="text-mono">USD</span>
            </div>
            <div class="metric-value">${this.formatCurrency(data.revenue)}</div>
            <div class="metric-comparison ${data.revenue_change >= 0 ? '' : 'neutral'}">
              ${data.revenue_change !== undefined ? `${data.revenue_change >= 0 ? '+' : ''}${data.revenue_change}% vs prev period` : 'Current period'}
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Orders</span>
              <span class="text-mono">COUNT</span>
            </div>
            <div class="metric-value">${this.formatNumber(data.orders)}</div>
            <div class="metric-comparison neutral">
              ${data.orders_change !== undefined ? `${data.orders_change >= 0 ? '+' : ''}${data.orders_change}% vs prev period` : 'Completed orders'}
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Average Order Value</span>
              <span class="text-mono">AOV</span>
            </div>
            <div class="metric-value">${this.formatCurrency(data.aov)}</div>
            <div class="metric-comparison neutral">
              Revenue per completed order
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Calculated Profit</span>
              <span class="text-mono">NET</span>
            </div>
            <div class="metric-value">${this.formatCurrency(data.profit)}</div>
            <div class="metric-comparison neutral">
              ${data.profit_margin ? `${(data.profit_margin * 100).toFixed(1)}% margin` : 'Gross minus unit costs'}
            </div>
          </div>
        </div>

        <div class="metrics-grid-4">
          <div class="metric-card">
            <div class="metric-label">
              <span>Units Sold</span>
              <span class="text-mono">VOL</span>
            </div>
            <div class="metric-value">${this.formatNumber(data.units_sold)}</div>
            <div class="metric-comparison neutral">
              Physical inventory items
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Unique Customers</span>
              <span class="text-mono">RECORDS</span>
            </div>
            <div class="metric-value">${this.formatNumber(data.customers_count)}</div>
            <div class="metric-comparison neutral">
              Distinct customer identities
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Active Products</span>
              <span class="text-mono">SKU</span>
            </div>
            <div class="metric-value">${this.formatNumber(data.products_count)}</div>
            <div class="metric-comparison neutral">
              Catalog items with recorded activity
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Repeat Purchase Rate</span>
              <span class="text-mono">RETENTION</span>
            </div>
            <div class="metric-value">${this.formatPercent(data.repeat_purchase_rate)}</div>
            <div class="metric-comparison neutral">
              Customers with > 1 order
            </div>
          </div>
        </div>

        <div class="dashboard-grid-2col">
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Period Summary</div>
                <div class="card-subtitle">Performance breakdown according to backend records</div>
              </div>
              <span class="badge badge-status"><span class="status-dot active"></span> LIVE DATA</span>
            </div>
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Context</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="cell-primary">Return Rate</td>
                    <td class="cell-mono">${this.formatPercent(data.return_rate)}</td>
                    <td class="text-muted">Refunded or returned units</td>
                  </tr>
                  <tr>
                    <td class="cell-primary">Avg Units per Order</td>
                    <td class="cell-mono">${data.orders ? (data.units_sold / data.orders).toFixed(1) : '—'}</td>
                    <td class="text-muted">Basket depth</td>
                  </tr>
                  <tr>
                    <td class="cell-primary">Gross Margin Rate</td>
                    <td class="cell-mono">${data.profit_margin ? this.formatPercent(data.profit_margin) : '—'}</td>
                    <td class="text-muted">Calculated product margins</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Data Pipeline Status</div>
                <div class="card-subtitle">Active connection & calculation cycle</div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <span class="text-muted" style="font-size: 0.8125rem;">Source Mode</span>
                <span class="text-mono" style="font-size: 0.8125rem;">${data.data_source || 'Connected Store / CSV'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <span class="text-muted" style="font-size: 0.8125rem;">Calculations Engine</span>
                <span class="text-mono" style="font-size: 0.8125rem;">Rule-Based Thresholds</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                <span class="text-muted" style="font-size: 0.8125rem;">Last Synchronized</span>
                <span class="text-mono" style="font-size: 0.8125rem;">${data.last_synced || 'Recently'}</span>
              </div>
              <div style="margin-top: 8px;">
                <button type="button" class="btn btn-secondary btn-sm w-full" id="overview-refresh-btn">
                  REFRESH OVERVIEW
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const refreshBtn = document.getElementById('overview-refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          Dashboard.loadOverview(container);
        });
      }
    }
  };

  window.ECOMLYTICS_DASHBOARD = Dashboard;
})(window);
