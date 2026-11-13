/**
 * ECOMLYTICS — Product Intelligence Module
 * Search, filter, sort, and pagination for /api/products
 */

(function (window) {
  'use strict';

  const Products = {
    allProducts: [],
    filteredProducts: [],
    searchQuery: '',
    selectedCategory: 'all',
    sortColumn: 'revenue',
    sortDirection: 'desc',
    currentPage: 1,
    pageSize: 10,

    renderLoading(container) {
      container.innerHTML = `
        <div class="card">
          <div class="skeleton" style="height: 38px; width: 100%; margin-bottom: 20px;"></div>
          ${Array(5).fill(0).map(() => `
            <div class="skeleton" style="height: 48px; width: 100%; margin-bottom: 8px;"></div>
          `).join('')}
        </div>
      `;
    },

    renderEmptyState(container, message) {
      container.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <div class="empty-state-title">No products available yet.</div>
          <div class="empty-state-text">
            ${message || 'Connect a data source or import catalog records to evaluate product-level revenue, margins, and conversion.'}
          </div>
          <button type="button" class="btn btn-primary" id="products-connect-btn">
            CONNECT DATA SOURCE
          </button>
        </div>
      `;

      const btn = document.getElementById('products-connect-btn');
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
          <div class="error-state-title">Unable to load product analytics.</div>
          <div class="error-state-text">${errorMsg || 'Please try again.'}</div>
          <button type="button" class="btn btn-secondary" id="products-retry-btn">RETRY</button>
        </div>
      `;

      const retryBtn = document.getElementById('products-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          Products.loadProducts(container);
        });
      }
    },

    async loadProducts(container) {
      if (!container) return;
      this.renderLoading(container);

      const result = await window.ECOMLYTICS_API.getProducts();

      if (!result.success) {
        this.renderErrorState(container, result.error);
        return;
      }

      const raw = result.data;
      const productsList = Array.isArray(raw) ? raw : (raw && raw.products ? raw.products : []);

      if (!productsList || productsList.length === 0) {
        this.renderEmptyState(container);
        return;
      }

      this.allProducts = productsList;
      this.applyFilterAndRender(container);
    },

    applyFilterAndRender(container) {
      let filtered = [...this.allProducts];

      // Search filter
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(p => 
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q))
        );
      }

      // Category filter
      if (this.selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category === this.selectedCategory);
      }

      // Sorting
      filtered.sort((a, b) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];

        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (typeof valA === 'string') {
          return this.sortDirection === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }

        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      });

      this.filteredProducts = filtered;

      // Extract unique categories
      const categories = Array.from(new Set(this.allProducts.map(p => p.category).filter(Boolean)));

      // Pagination slice
      const totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
      if (this.currentPage > totalPages) this.currentPage = totalPages;
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const pageItems = filtered.slice(startIndex, startIndex + this.pageSize);

      const formatCurrency = window.ECOMLYTICS_DASHBOARD ? window.ECOMLYTICS_DASHBOARD.formatCurrency : (v) => `$${v}`;
      const formatPercent = window.ECOMLYTICS_DASHBOARD ? window.ECOMLYTICS_DASHBOARD.formatPercent : (v) => `${(v * 100).toFixed(1)}%`;

      container.innerHTML = `
        <div class="filter-bar">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" class="form-control search-input" id="products-search-input" placeholder="Search by name, SKU..." value="${this.searchQuery}">
          </div>

          <div class="filter-group">
            <select class="form-control form-select" id="products-category-select" style="min-width: 160px;">
              <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>All Categories</option>
              ${categories.map(cat => `
                <option value="${cat}" ${this.selectedCategory === cat ? 'selected' : ''}>${cat}</option>
              `).join('')}
            </select>
          </div>
        </div>

        ${filtered.length === 0 ? `
          <div class="empty-state" style="padding: 48px 24px;">
            <div class="empty-state-title">No matching products</div>
            <div class="empty-state-text">No catalog items matched your query "${this.searchQuery}".</div>
            <button type="button" class="btn btn-secondary btn-sm" id="reset-product-search">RESET FILTERS</button>
          </div>
        ` : `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="sortable" data-sort="name">Product</th>
                  <th class="sortable" data-sort="category">Category</th>
                  <th class="sortable" data-sort="revenue">Revenue</th>
                  <th class="sortable" data-sort="profit">Profit</th>
                  <th class="sortable" data-sort="margin">Margin</th>
                  <th class="sortable" data-sort="units_sold">Units</th>
                  <th class="sortable" data-sort="conversion_rate">Conversion</th>
                  <th class="sortable" data-sort="return_rate">Returns</th>
                  <th class="sortable" data-sort="rating">Rating</th>
                </tr>
              </thead>
              <tbody>
                ${pageItems.map(p => `
                  <tr>
                    <td class="cell-primary">
                      <div>${p.name || 'Untitled SKU'}</div>
                      <div class="text-mono text-muted" style="font-size: 10px;">${p.sku || p.id || '—'}</div>
                    </td>
                    <td>${p.category || 'General'}</td>
                    <td class="cell-mono">${formatCurrency(p.revenue)}</td>
                    <td class="cell-mono">${formatCurrency(p.profit)}</td>
                    <td class="cell-mono">${p.margin !== undefined ? formatPercent(p.margin) : '—'}</td>
                    <td class="cell-mono">${p.units_sold !== undefined ? p.units_sold : '—'}</td>
                    <td class="cell-mono">${p.conversion_rate !== undefined ? formatPercent(p.conversion_rate) : '—'}</td>
                    <td class="cell-mono">${p.return_rate !== undefined ? formatPercent(p.return_rate) : '—'}</td>
                    <td class="cell-mono">${p.rating !== undefined ? Number(p.rating).toFixed(1) + ' ★' : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <span>Showing ${startIndex + 1}–${Math.min(startIndex + this.pageSize, filtered.length)} of ${filtered.length} products</span>
            <div class="flex gap-xs">
              <button class="btn btn-secondary btn-sm" id="prod-prev-page" ${this.currentPage <= 1 ? 'disabled' : ''}>PREV</button>
              <button class="btn btn-secondary btn-sm" id="prod-next-page" ${this.currentPage >= totalPages ? 'disabled' : ''}>NEXT</button>
            </div>
          </div>
        `}
      `;

      // Event listeners
      const searchInput = document.getElementById('products-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.currentPage = 1;
          this.applyFilterAndRender(container);
        });
      }

      const catSelect = document.getElementById('products-category-select');
      if (catSelect) {
        catSelect.addEventListener('change', (e) => {
          this.selectedCategory = e.target.value;
          this.currentPage = 1;
          this.applyFilterAndRender(container);
        });
      }

      const resetBtn = document.getElementById('reset-product-search');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.searchQuery = '';
          this.selectedCategory = 'all';
          this.currentPage = 1;
          this.applyFilterAndRender(container);
        });
      }

      const prevBtn = document.getElementById('prod-prev-page');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          if (this.currentPage > 1) {
            this.currentPage--;
            this.applyFilterAndRender(container);
          }
        });
      }

      const nextBtn = document.getElementById('prod-next-page');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          if (this.currentPage < totalPages) {
            this.currentPage++;
            this.applyFilterAndRender(container);
          }
        });
      }

      // Sort column headers
      container.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
          const col = th.getAttribute('data-sort');
          if (this.sortColumn === col) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            this.sortColumn = col;
            this.sortDirection = 'desc';
          }
          this.applyFilterAndRender(container);
        });
      });
    }
  };

  window.ECOMLYTICS_PRODUCTS = Products;
})(window);
