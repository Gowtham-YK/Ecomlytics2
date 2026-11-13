/**
 * ECOMLYTICS — Funnel Analytics Module
 * Connects to /api/funnel: Views -> Add to Cart -> Checkout -> Purchase
 */

(function (window) {
  'use strict';

  const Funnel = {
    renderLoading(container) {
      container.innerHTML = `
        <div class="metrics-grid-4" style="margin-bottom: 24px;">
          ${Array(4).fill(0).map(() => `
            <div class="metric-card">
              <div class="skeleton" style="height: 12px; width: 50%;"></div>
              <div class="skeleton" style="height: 32px; width: 75%; margin: 12px 0;"></div>
            </div>
          `).join('')}
        </div>
        <div class="card">
          ${Array(4).fill(0).map(() => `
            <div class="skeleton" style="height: 56px; width: 100%; margin-bottom: 16px;"></div>
          `).join('')}
        </div>
      `;
    },

    renderEmptyState(container, message) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <div class="empty-state-title">No funnel data available yet.</div>
          <div class="empty-state-text">
            ${message || 'Connect store tracking or GA4 analytics to calculate customer progression from Product Views through Checkout and Purchase.'}
          </div>
          <button type="button" class="btn btn-primary" id="funnel-connect-btn">
            CONNECT DATA SOURCE
          </button>
        </div>
      `;

      const btn = document.getElementById('funnel-connect-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          if (window.ECOMLYTICS_APP) {
            window.ECOMLYTICS_APP.switchView('data-sources');
          }
        });
      }
    },

    renderErrorState(container, errorMsg) {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-state-title">Unable to load funnel analytics.</div>
          <div class="error-state-text">${errorMsg || 'Please try again.'}</div>
          <button type="button" class="btn btn-secondary" id="funnel-retry-btn">RETRY</button>
        </div>
      `;

      const retryBtn = document.getElementById('funnel-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          Funnel.loadFunnel(container);
        });
      }
    },

    async loadFunnel(container) {
      if (!container) return;
      this.renderLoading(container);

      const result = await window.ECOMLYTICS_API.getFunnel();

      if (!result.success) {
        this.renderErrorState(container, result.error);
        return;
      }

      const data = result.data;
      if (!data || Object.keys(data).length === 0 || (!data.stages && !data.product_views)) {
        this.renderEmptyState(container);
        return;
      }

      // Structure stages: Views -> Cart -> Checkout -> Purchase
      const stages = Array.isArray(data.stages) ? data.stages : [
        { name: 'PRODUCT VIEWS', key: 'product_views', count: data.product_views || 0 },
        { name: 'ADD TO CART', key: 'add_to_cart', count: data.add_to_cart || 0 },
        { name: 'CHECKOUT', key: 'checkout', count: data.checkout || 0 },
        { name: 'PURCHASE', key: 'purchase', count: data.purchase || 0 }
      ];

      const maxCount = Math.max(...stages.map(s => s.count || 0), 1);
      const topCount = stages[0] ? (stages[0].count || 0) : 1;
      const finalCount = stages[stages.length - 1] ? (stages[stages.length - 1].count || 0) : 0;
      const overallConversion = topCount > 0 ? ((finalCount / topCount) * 100).toFixed(2) + '%' : '0.00%';

      const formatNumber = window.ECOMLYTICS_DASHBOARD ? window.ECOMLYTICS_DASHBOARD.formatNumber : (v) => v;

      container.innerHTML = `
        <div class="metrics-grid-4" style="margin-bottom: 24px;">
          <div class="metric-card">
            <div class="metric-label">Initial Stage Traffic</div>
            <div class="metric-value">${formatNumber(stages[0].count)}</div>
            <div class="metric-comparison neutral">Product Page Views</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Completed Purchases</div>
            <div class="metric-value">${formatNumber(finalCount)}</div>
            <div class="metric-comparison neutral">Final Funnel Event</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Overall Conversion</div>
            <div class="metric-value">${overallConversion}</div>
            <div class="metric-comparison neutral">Views to Purchase</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Calculated Drop-off</div>
            <div class="metric-value">${topCount > 0 ? (100 - (finalCount / topCount) * 100).toFixed(1) + '%' : '—'}</div>
            <div class="metric-comparison neutral">Cumulative attrition</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Stage Progression Pipeline</div>
              <div class="card-subtitle">Volume retention and drop-off between consecutive funnel steps</div>
            </div>
          </div>

          <div class="funnel-pipeline">
            ${stages.map((stage, idx) => {
              const widthPct = Math.max(2, Math.round(((stage.count || 0) / maxCount) * 100));
              const prevStage = idx > 0 ? stages[idx - 1] : null;
              const stepConversion = prevStage && prevStage.count > 0 
                ? ((stage.count / prevStage.count) * 100).toFixed(1) + '%'
                : '100%';
              const dropPercent = prevStage && prevStage.count > 0
                ? (100 - (stage.count / prevStage.count) * 100).toFixed(1) + '%'
                : null;
              const dropCount = prevStage ? Math.max(0, prevStage.count - stage.count) : 0;

              return `
                ${idx > 0 ? `
                  <div class="funnel-drop-indicator">
                    <span>↓ Step Conversion: <strong>${stepConversion}</strong></span>
                    <span style="color: var(--text-muted);">| Drop-off: ${formatNumber(dropCount)} sessions (${dropPercent})</span>
                  </div>
                ` : ''}

                <div class="funnel-stage-row">
                  <div class="funnel-stage-name">
                    ${stage.name}
                  </div>
                  <div class="funnel-bar-track">
                    <div class="funnel-bar-fill" style="width: ${widthPct}%;"></div>
                  </div>
                  <div class="funnel-stage-stats">
                    <div class="funnel-stage-count">${formatNumber(stage.count)}</div>
                    <div class="funnel-stage-conversion">${idx === 0 ? '100% of top' : stepConversion + ' step rate'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  };

  window.ECOMLYTICS_FUNNEL = Funnel;
})(window);
