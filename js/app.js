/**
 * ECOMLYTICS — Main Application Workspace Controller
 * View routing, sidebar navigation, backend connectivity monitor, global sync
 */

(function (window) {
  'use strict';

  const App = {
    currentView: 'overview',
    views: ['overview', 'sales', 'products', 'customers', 'funnel', 'insights', 'data-sources', 'settings'],

    init() {
      this.bindNavigation();
      this.bindMobileSidebar();
      this.bindUserControls();
      this.checkConnection();

      // Check URL hash for initial view
      const hash = window.location.hash.replace('#', '');
      const initialView = this.views.includes(hash) ? hash : 'overview';
      this.switchView(initialView);

      // Listen for browser back/forward buttons
      window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '');
        if (this.views.includes(h) && h !== this.currentView) {
          this.switchView(h, false);
        }
      });

      // Periodic health check (every 30 seconds)
      setInterval(() => this.checkConnection(), 30000);
    },

    bindNavigation() {
      const navItems = document.querySelectorAll('.app-sidebar .nav-item[data-view]');
      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const targetView = item.getAttribute('data-view');
          this.switchView(targetView);
          
          // Close mobile sidebar on navigation
          const sidebar = document.querySelector('.app-sidebar');
          if (sidebar) sidebar.classList.remove('open');
        });
      });
    },

    bindMobileSidebar() {
      const toggle = document.querySelector('.mobile-sidebar-toggle');
      const sidebar = document.querySelector('.app-sidebar');

      if (toggle && sidebar) {
        toggle.addEventListener('click', () => {
          sidebar.classList.toggle('open');
        });
      }

      // Close when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('open')) {
          if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
            sidebar.classList.remove('open');
          }
        }
      });
    },

    bindUserControls() {
      // Global refresh button
      const refreshBtn = document.getElementById('global-sync-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.checkConnection();
          this.refreshCurrentView();
        });
      }

      // Logout buttons
      const logoutBtns = document.querySelectorAll('[data-action="logout"]');
      logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('Are you sure you want to log out of Ecomlytics?')) {
            window.ECOMLYTICS_AUTH.logout();
          }
        });
      });
    },

    async checkConnection() {
      const dot = document.getElementById('status-dot-indicator');
      const text = document.getElementById('status-text-indicator');

      if (!dot || !text) return;

      const health = await window.ECOMLYTICS_API.checkHealth();
      if (health.success) {
        dot.className = 'connection-dot online';
        text.textContent = 'API ONLINE';
      } else {
        dot.className = 'connection-dot offline';
        text.textContent = 'API DISCONNECTED';
      }
    },

    switchView(viewName, updateHash = true) {
      if (!this.views.includes(viewName)) return;

      this.currentView = viewName;

      if (window.ECOMLYTICS_ANALYTICS) {
        if (viewName === 'overview') window.ECOMLYTICS_ANALYTICS.track('dashboard_viewed');
        if (viewName === 'funnel') window.ECOMLYTICS_ANALYTICS.track('funnel_viewed');
        if (viewName === 'customers') window.ECOMLYTICS_ANALYTICS.track('customer_segments_viewed');
      }

      // Update sidebar nav items
      const navItems = document.querySelectorAll('.app-sidebar .nav-item[data-view]');
      navItems.forEach(item => {
        const isMatch = item.getAttribute('data-view') === viewName;
        item.classList.toggle('active', isMatch);
      });

      // Update Topbar page title
      const pageTitle = document.getElementById('topbar-page-title');
      if (pageTitle) {
        pageTitle.textContent = viewName.replace('-', ' ').toUpperCase();
      }

      // Update view DOM panels
      const viewPanels = document.querySelectorAll('.app-view');
      viewPanels.forEach(panel => {
        const isMatch = panel.id === `view-${viewName}`;
        panel.classList.toggle('active', isMatch);
      });

      if (updateHash) {
        window.location.hash = viewName;
      }

      // Load view specific data
      this.refreshCurrentView();
    },

    refreshCurrentView() {
      const container = document.getElementById(`view-${this.currentView}`);
      if (!container) return;

      switch (this.currentView) {
        case 'overview':
          if (window.ECOMLYTICS_DASHBOARD) window.ECOMLYTICS_DASHBOARD.loadOverview(container);
          break;
        case 'sales':
          if (window.ECOMLYTICS_SALES) window.ECOMLYTICS_SALES.loadSales(container);
          break;
        case 'products':
          if (window.ECOMLYTICS_PRODUCTS) window.ECOMLYTICS_PRODUCTS.loadProducts(container);
          break;
        case 'customers':
          if (window.ECOMLYTICS_CUSTOMERS) window.ECOMLYTICS_CUSTOMERS.loadCustomers(container);
          break;
        case 'funnel':
          if (window.ECOMLYTICS_FUNNEL) window.ECOMLYTICS_FUNNEL.loadFunnel(container);
          break;
        case 'insights':
          if (window.ECOMLYTICS_INSIGHTS) window.ECOMLYTICS_INSIGHTS.loadInsights(container);
          break;
        case 'data-sources':
          if (window.ECOMLYTICS_DATASOURCES) window.ECOMLYTICS_DATASOURCES.loadDataSources(container);
          break;
        case 'settings':
          if (window.ECOMLYTICS_SETTINGS) window.ECOMLYTICS_SETTINGS.loadSettings(container);
          break;
      }
    }
  };

  window.ECOMLYTICS_APP = App;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})(window);
