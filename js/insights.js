/**
 * ECOMLYTICS — Business Insights Module
 * Rule-based investigation engine from /api/insights
 */

(function (window) {
  'use strict';

  const Insights = {
    renderLoading(container) {
      container.innerHTML = `
        <div class="card" style="margin-bottom: 24px;">
          <div class="skeleton" style="height: 20px; width: 30%; margin-bottom: 12px;"></div>
          <div class="skeleton" style="height: 14px; width: 60%;"></div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${Array(3).fill(0).map(() => `
            <div class="card">
              <div class="skeleton" style="height: 16px; width: 20%; margin-bottom: 12px;"></div>
              <div class="skeleton" style="height: 24px; width: 50%; margin-bottom: 12px;"></div>
              <div class="skeleton" style="height: 14px; width: 80%; margin-bottom: 16px;"></div>
              <div class="skeleton" style="height: 32px; width: 40%;"></div>
            </div>
          `).join('')}
        </div>
      `;
    },

    renderEmptyState(container, message) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div class="empty-state-title">No priority investigation points detected.</div>
          <div class="empty-state-text">
            ${message || 'Ecomlytics derives insights using deterministic rule checks over product metrics, return rates, and customer recency. Connect a data source to generate investigation points.'}
          </div>
          <button type="button" class="btn btn-primary" id="insights-connect-btn">
            CONNECT DATA SOURCE
          </button>
        </div>
      `;

      const btn = document.getElementById('insights-connect-btn');
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
          <div class="error-state-title">Unable to evaluate store insights.</div>
          <div class="error-state-text">${errorMsg || 'Please try again.'}</div>
          <button type="button" class="btn btn-secondary" id="insights-retry-btn">RETRY</button>
        </div>
      `;

      const retryBtn = document.getElementById('insights-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          Insights.loadInsights(container);
        });
      }
    },

    async loadInsights(container) {
      if (!container) return;
      this.renderLoading(container);

      const result = await window.ECOMLYTICS_API.getInsights();

      if (!result.success) {
        this.renderErrorState(container, result.error);
        return;
      }

      const raw = result.data;
      const insightsList = Array.isArray(raw) ? raw : (raw && raw.insights ? raw.insights : []);

      if (!insightsList || insightsList.length === 0) {
        this.renderEmptyState(container);
        return;
      }

      container.innerHTML = `
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title">Rule-Based Diagnostic Engine</div>
              <div class="card-subtitle">Derived deterministically from product metrics, customer recency, and funnel thresholds</div>
            </div>
            <span class="badge badge-high">${insightsList.length} INVESTIGATION POINTS</span>
          </div>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.6;">
            Ecomlytics flags business anomalies and prioritizes actionable investigation points across pricing, product content, reviews, stock availability, and checkout friction.
          </p>
        </div>

        <div class="insights-feed">
          ${insightsList.map(item => {
            const priority = (item.priority || 'MEDIUM').toUpperCase();
            const isHigh = priority === 'HIGH' || priority === 'CRITICAL';
            const actionTags = Array.isArray(item.recommended_actions) 
              ? item.recommended_actions 
              : (item.actions ? item.actions : ['Pricing', 'Product content', 'Reviews', 'Stock', 'Checkout friction']);

            return `
              <div class="insight-card ${isHigh ? 'high-priority' : 'medium-priority'}">
                <div class="insight-header">
                  <span class="badge ${isHigh ? 'badge-high' : 'badge-med'}">
                    ${priority} PRIORITY
                  </span>
                  <span class="text-mono text-muted" style="font-size: 11px;">
                    ${item.category || item.type || 'DIAGNOSTIC'}
                  </span>
                </div>
                <div class="insight-title">${item.title || 'Store Performance Investigation'}</div>
                <div class="insight-explanation">
                  ${item.explanation || item.description || item.reason || 'Pattern identified in recent transaction series requiring operational review.'}
                </div>
                
                <div class="insight-investigation">
                  <div class="investigation-label">Consider Investigating:</div>
                  <div class="investigation-tags">
                    ${actionTags.map(tag => `<span class="investigation-tag">${tag}</span>`).join('')}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  };

  window.ECOMLYTICS_INSIGHTS = Insights;
})(window);
