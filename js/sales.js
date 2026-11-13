/**
 * ECOMLYTICS — Sales Analytics Module
 * Connects to /api/overview & /api/sales without hardcoded fake trend bars
 */

(function (window) {
  'use strict';

  const Sales = {
    renderLoading(container) {
      container.innerHTML = `
        <div class="metrics-grid-3">
          ${Array(3).fill(0).map(() => `
            <div class="metric-card">
              <div class="skeleton" style="height: 12px; width: 50%;"></div>
              <div class="skeleton" style="height: 32px; width: 75%; margin: 12px 0;"></div>
              <div class="skeleton" style="height: 12px; width: 40%;"></div>
            </div>
          `).join('')}
        </div>
        <div class="card" style="margin-top: 24px;">
          <div class="skeleton" style="height: 20px; width: 25%; margin-bottom: 24px;"></div>
          <div class="skeleton" style="height: 240px; width: 100%;"></div>
        </div>
      `;
    },

    renderEmptyState(container) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <div class="empty-state-title">No sales data available yet.</div>
          <div class="empty-state-text">
            Connect a data source to begin analyzing your store sales, AOV, and profit calculations.
          </div>
          <button type="button" class="btn btn-primary" id="sales-connect-btn">
            CONNECT DATA SOURCE
          </button>
        </div>
      `;

      const connectBtn = document.getElementById('sales-connect-btn');
      if (connectBtn) {
        connectBtn.addEventListener('click', () => {
          if (window.ECOMLYTICS_APP) {
            window.ECOMLYTICS_APP.switchView('data-sources');
          }
        });
      }
    },

    renderErrorState(container, errorMsg) {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-state-title">Unable to load sales data.</div>
          <div class="error-state-text">${errorMsg || 'Please try again.'}</div>
          <button type="button" class="btn btn-secondary" id="sales-retry-btn">RETRY</button>
        </div>
      `;

      const retryBtn = document.getElementById('sales-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          Sales.loadSales(container);
        });
      }
    },

    async loadSales(container) {
      if (!container) return;
      this.renderLoading(container);

      // Fetch overview metrics which contain sales calculations
      const result = await window.ECOMLYTICS_API.getOverview();

      if (!result.success) {
        this.renderErrorState(container, result.error);
        return;
      }

      const data = result.data;
      if (!data || Object.keys(data).length === 0 || (data.revenue === 0 && data.orders === 0)) {
        this.renderEmptyState(container);
        return;
      }

      // Check whether backend provided genuine trend data
      const hasBackendTrend = Array.isArray(data.revenue_trend) && data.revenue_trend.length > 0;

      let trendHtml = '';
      if (hasBackendTrend) {
        const trend = data.revenue_trend;
        const maxVal = Math.max(...trend.map(t => t.value || 0), 1);
        const barsHtml = trend.map((point) => {
          const heightPercent = Math.max(4, Math.round(((point.value || 0) / maxVal) * 100));
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <div style="width: 100%; height: 180px; display: flex; align-items: flex-end; background-color: var(--surface-highlight); border-radius: 2px;">
                <div style="width: 100%; height: ${heightPercent}%; background-color: #FFFFFF; opacity: 0.9; border-radius: 2px;" title="${point.label || ''}: $${point.value}"></div>
              </div>
              <span class="text-mono text-muted" style="font-size: 10px;">${point.label || ''}</span>
            </div>
          `;
        }).join('');

        trendHtml = `
          <div class="card" style="margin-top: 24px;">
            <div class="card-header">
              <div>
                <div class="card-title">Backend Sales Trend</div>
                <div class="card-subtitle">Aggregated periodic data from API</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: flex-end; padding-top: 16px;">
              ${barsHtml}
            </div>
          </div>
        `;
      } else {
        trendHtml = `
          <div class="card" style="margin-top: 24px;">
            <div class="card-header">
              <div>
                <div class="card-title">Periodic Revenue Trend</div>
                <div class="card-subtitle">Derived strictly from recorded transactions</div>
              </div>
            </div>
            <div style="padding: 40px 20px; text-align: center; border: 1px dashed var(--border); border-radius: 4px;">
              <div style="font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 8px;">
                NO DERIVED PERIODIC TREND IN CURRENT DATASET
              </div>
              <p style="font-size: 0.8125rem; color: var(--text-secondary); max-width: 480px; margin: 0 auto; line-height: 1.6;">
                Ecomlytics only renders chronological sales trends when timestamped order series are provided by the backend API. Hardcoded visual trend charts are intentionally excluded.
              </p>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="metrics-grid-3">
          <div class="metric-card">
            <div class="metric-label">
              <span>Gross Sales Revenue</span>
              <span class="text-mono">USD</span>
            </div>
            <div class="metric-value">${window.ECOMLYTICS_DASHBOARD.formatCurrency(data.revenue)}</div>
            <div class="metric-comparison neutral">
              ${data.orders ? `${data.orders} completed transactions` : 'Total sales'}
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Calculated Net Profit</span>
              <span class="text-mono">NET</span>
            </div>
            <div class="metric-value">${window.ECOMLYTICS_DASHBOARD.formatCurrency(data.profit)}</div>
            <div class="metric-comparison neutral">
              ${data.profit_margin ? `${(data.profit_margin * 100).toFixed(1)}% margin` : 'Revenue minus cost of goods'}
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Average Order Value</span>
              <span class="text-mono">AOV</span>
            </div>
            <div class="metric-value">${window.ECOMLYTICS_DASHBOARD.formatCurrency(data.aov)}</div>
            <div class="metric-comparison neutral">
              Mean value per customer order
            </div>
          </div>
        </div>

        <div class="metrics-grid-3" style="margin-top: 24px;">
          <div class="metric-card">
            <div class="metric-label">
              <span>Units Sold</span>
              <span class="text-mono">VOL</span>
            </div>
            <div class="metric-value">${window.ECOMLYTICS_DASHBOARD.formatNumber(data.units_sold)}</div>
            <div class="metric-comparison neutral">
              Individual items fulfilled
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Return Rate</span>
              <span class="text-mono">RETURN</span>
            </div>
            <div class="metric-value">${window.ECOMLYTICS_DASHBOARD.formatPercent(data.return_rate)}</div>
            <div class="metric-comparison neutral">
              Units returned or refunded
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">
              <span>Repeat Purchase Rate</span>
              <span class="text-mono">RETENTION</span>
            </div>
            <div class="metric-value">${window.ECOMLYTICS_DASHBOARD.formatPercent(data.repeat_purchase_rate)}</div>
            <div class="metric-comparison neutral">
              Multi-order customer ratio
            </div>
          </div>
        </div>

        ${trendHtml}
      `;
    }
  };

  window.ECOMLYTICS_SALES = Sales;
})(window);
