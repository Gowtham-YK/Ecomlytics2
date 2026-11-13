/**
 * ECOMLYTICS — Customer Intelligence Module
 * Rule-based segments (NEW, RETURNING, LOYAL, VIP, AT RISK) from /api/customers/segments
 */

(function (window) {
  'use strict';

  const Customers = {
    segmentData: null,
    activeSegmentFilter: 'ALL',
    searchQuery: '',
    currentPage: 1,
    pageSize: 10,

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
          <div class="skeleton" style="height: 48px; width: 100%; margin-bottom: 16px;"></div>
          ${Array(5).fill(0).map(() => `
            <div class="skeleton" style="height: 40px; width: 100%; margin-bottom: 8px;"></div>
          `).join('')}
        </div>
      `;
    },

    renderEmptyState(container, message) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <div class="empty-state-title">No customer segmentation data yet.</div>
          <div class="empty-state-text">
            ${message || 'Connect your store transactions to evaluate customer behavior and classify profiles into rule-based segments (New, Returning, Loyal, VIP, At Risk).'}
          </div>
          <button type="button" class="btn btn-primary" id="customers-connect-btn">
            CONNECT DATA SOURCE
          </button>
        </div>
      `;

      const btn = document.getElementById('customers-connect-btn');
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
          <div class="error-state-title">Unable to load customer intelligence.</div>
          <div class="error-state-text">${errorMsg || 'Please try again.'}</div>
          <button type="button" class="btn btn-secondary" id="customers-retry-btn">RETRY</button>
        </div>
      `;

      const retryBtn = document.getElementById('customers-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          Customers.loadCustomers(container);
        });
      }
    },

    async loadCustomers(container) {
      if (!container) return;
      this.renderLoading(container);

      const result = await window.ECOMLYTICS_API.getCustomerSegments();

      if (!result.success) {
        this.renderErrorState(container, result.error);
        return;
      }

      const data = result.data;
      if (!data || Object.keys(data).length === 0) {
        this.renderEmptyState(container);
        return;
      }

      this.segmentData = data;
      this.applyFilterAndRender(container);
    },

    applyFilterAndRender(container) {
      const data = this.segmentData;
      const segmentsCount = data.segment_counts || {
        'NEW': data.new_customers || 0,
        'RETURNING': data.returning_customers || 0,
        'LOYAL': data.loyal_customers || 0,
        'VIP': data.vip_customers || 0,
        'AT_RISK': data.at_risk_customers || 0
      };

      const formatNumber = window.ECOMLYTICS_DASHBOARD ? window.ECOMLYTICS_DASHBOARD.formatNumber : (v) => v;
      const formatCurrency = window.ECOMLYTICS_DASHBOARD ? window.ECOMLYTICS_DASHBOARD.formatCurrency : (v) => `$${v}`;

      let customersList = data.customers || [];

      // Filter by active segment tab
      if (this.activeSegmentFilter !== 'ALL') {
        customersList = customersList.filter(c => {
          const seg = (c.segment || '').toUpperCase().replace(/[\s-]/g, '_');
          return seg === this.activeSegmentFilter;
        });
      }

      // Filter by search query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        customersList = customersList.filter(c => 
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.id && String(c.id).toLowerCase().includes(q))
        );
      }

      // Pagination
      const totalPages = Math.ceil(customersList.length / this.pageSize) || 1;
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const pageItems = customersList.slice(startIndex, startIndex + this.pageSize);

      const segmentPills = [
        { id: 'ALL', label: 'All Segments', count: data.total_customers || customersList.length },
        { id: 'NEW', label: 'New', count: segmentsCount['NEW'] || segmentsCount['new'] || 0 },
        { id: 'RETURNING', label: 'Returning', count: segmentsCount['RETURNING'] || segmentsCount['returning'] || 0 },
        { id: 'LOYAL', label: 'Loyal', count: segmentsCount['LOYAL'] || segmentsCount['loyal'] || 0 },
        { id: 'VIP', label: 'VIP', count: segmentsCount['VIP'] || segmentsCount['vip'] || 0 },
        { id: 'AT_RISK', label: 'At Risk', count: segmentsCount['AT_RISK'] || segmentsCount['at_risk'] || 0 }
      ];

      container.innerHTML = `
        <div class="metrics-grid-4" style="margin-bottom: 24px;">
          <div class="metric-card">
            <div class="metric-label">Total Customers</div>
            <div class="metric-value">${formatNumber(data.total_customers || customersList.length)}</div>
            <div class="metric-comparison neutral">Recorded profiles</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Repeat Rate</div>
            <div class="metric-value">${data.repeat_purchase_rate ? (data.repeat_purchase_rate * 100).toFixed(1) + '%' : '—'}</div>
            <div class="metric-comparison neutral">Multiple transactions</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">VIP Cohort</div>
            <div class="metric-value">${formatNumber(segmentsCount['VIP'] || segmentsCount['vip'] || 0)}</div>
            <div class="metric-comparison neutral">Highest cumulative spend</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">At Risk Segment</div>
            <div class="metric-value">${formatNumber(segmentsCount['AT_RISK'] || segmentsCount['at_risk'] || 0)}</div>
            <div class="metric-comparison neutral">Lapsed recency threshold</div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title">Segmentation Methodology</div>
              <div class="card-subtitle">Deterministic rules calculated by backend engine</div>
            </div>
            <span class="badge">EXPLICIT THRESHOLDS</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; font-size: 0.8125rem;">
            <div><strong>NEW:</strong> 1 purchase within recent window</div>
            <div><strong>RETURNING:</strong> 2–3 purchases</div>
            <div><strong>LOYAL:</strong> 4+ purchases with consistent cadence</div>
            <div><strong>VIP:</strong> Top tier total spend & frequency</div>
            <div><strong>AT RISK:</strong> Prior repeat customer with no recency</div>
          </div>
        </div>

        <div class="tab-list">
          ${segmentPills.map(p => `
            <button class="tab-btn ${this.activeSegmentFilter === p.id ? 'active' : ''}" data-segment="${p.id}">
              ${p.label} <span class="text-mono text-muted" style="font-size: 11px;">(${p.count})</span>
            </button>
          `).join('')}
        </div>

        <div class="filter-bar">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" class="form-control search-input" id="customers-search-input" placeholder="Search customer ID, email, name..." value="${this.searchQuery}">
          </div>
        </div>

        ${customersList.length === 0 ? `
          <div class="empty-state" style="padding: 40px 20px;">
            <div class="empty-state-title">No customer profiles in this view</div>
            <div class="empty-state-text">No records matched the selected segment or search criteria.</div>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Segment</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Average Order</th>
                  <th>Last Purchase</th>
                </tr>
              </thead>
              <tbody>
                ${pageItems.map(c => `
                  <tr>
                    <td class="cell-primary">
                      <div>${c.name || c.email || 'Customer #' + c.id}</div>
                      <div class="text-mono text-muted" style="font-size: 10px;">${c.email || c.id || ''}</div>
                    </td>
                    <td>
                      <span class="badge ${c.segment === 'VIP' ? 'badge-high' : (c.segment === 'AT RISK' || c.segment === 'AT_RISK' ? 'badge-med' : '')}">
                        ${c.segment || 'NEW'}
                      </span>
                    </td>
                    <td class="cell-mono">${c.total_orders || c.orders || 1}</td>
                    <td class="cell-mono">${formatCurrency(c.total_spent || c.spend || 0)}</td>
                    <td class="cell-mono">${formatCurrency(c.aov || (c.total_spent && c.total_orders ? c.total_spent / c.total_orders : 0))}</td>
                    <td class="cell-mono text-muted">${c.last_purchase_date || c.last_order || 'Recorded'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <span>Showing ${startIndex + 1}–${Math.min(startIndex + this.pageSize, customersList.length)} of ${customersList.length} customers</span>
            <div class="flex gap-xs">
              <button class="btn btn-secondary btn-sm" id="cust-prev-page" ${this.currentPage <= 1 ? 'disabled' : ''}>PREV</button>
              <button class="btn btn-secondary btn-sm" id="cust-next-page" ${this.currentPage >= totalPages ? 'disabled' : ''}>NEXT</button>
            </div>
          </div>
        `}
      `;

      // Event listeners
      container.querySelectorAll('.tab-btn[data-segment]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeSegmentFilter = btn.getAttribute('data-segment');
          this.currentPage = 1;
          this.applyFilterAndRender(container);
        });
      });

      const searchInput = document.getElementById('customers-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.currentPage = 1;
          this.applyFilterAndRender(container);
        });
      }

      const prevBtn = document.getElementById('cust-prev-page');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (this.currentPage > 1) {
            this.currentPage--;
            this.applyFilterAndRender(container);
          }
        });
      }

      const nextBtn = document.getElementById('cust-next-page');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentPage < totalPages) {
            this.currentPage++;
            this.applyFilterAndRender(container);
          }
        });
      }
    }
  };

  window.ECOMLYTICS_CUSTOMERS = Customers;
})(window);
