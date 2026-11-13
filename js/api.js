/**
 * ECOMLYTICS — Centralized API Client Layer
 * Handles network calls, timeouts, errors, and JSON extraction
 */

(function (window) {
  'use strict';

  const API = {
    /**
     * Internal request executor with timeout and error wrapping
     */
    async _request(endpoint, options = {}) {
      const config = window.ECOMLYTICS_CONFIG;
      const baseUrl = config.API_BASE_URL;
      const url = `${baseUrl}${endpoint}`;

      const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
      };

      if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
      }

      // Add auth token if available in auth storage
      const token = localStorage.getItem('ecomlytics_auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch (_) {
            data = text;
          }
        }

        if (!response.ok) {
          return {
            success: false,
            status: response.status,
            error: (data && data.detail) || (data && data.message) || `HTTP Error ${response.status}`,
            data: data
          };
        }

        return {
          success: true,
          status: response.status,
          data: data
        };
      } catch (err) {
        clearTimeout(timeoutId);
        const isTimeout = err.name === 'AbortError';
        return {
          success: false,
          status: 0,
          error: isTimeout ? 'Request timed out' : (err.message || 'Network request failed'),
          isNetworkError: true
        };
      }
    },

    /**
     * Check backend health status (/api/health)
     */
    async checkHealth() {
      return await this._request(window.ECOMLYTICS_CONFIG.ENDPOINTS.HEALTH);
    },

    /**
     * Get Store Overview metrics (/api/overview)
     */
    async getOverview(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `${window.ECOMLYTICS_CONFIG.ENDPOINTS.OVERVIEW}${queryString ? '?' + queryString : ''}`;
      return await this._request(endpoint);
    },

    /**
     * Get Products Analytics (/api/products)
     */
    async getProducts(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `${window.ECOMLYTICS_CONFIG.ENDPOINTS.PRODUCTS}${queryString ? '?' + queryString : ''}`;
      return await this._request(endpoint);
    },

    /**
     * Get Customer Segments (/api/customers/segments)
     */
    async getCustomerSegments(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `${window.ECOMLYTICS_CONFIG.ENDPOINTS.CUSTOMERS_SEGMENTS}${queryString ? '?' + queryString : ''}`;
      return await this._request(endpoint);
    },

    /**
     * Get Conversion Funnel Stages (/api/funnel)
     */
    async getFunnel(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `${window.ECOMLYTICS_CONFIG.ENDPOINTS.FUNNEL}${queryString ? '?' + queryString : ''}`;
      return await this._request(endpoint);
    },

    /**
     * Get Rule-Based Business Insights (/api/insights)
     */
    async getInsights(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `${window.ECOMLYTICS_CONFIG.ENDPOINTS.INSIGHTS}${queryString ? '?' + queryString : ''}`;
      return await this._request(endpoint);
    },

    /**
     * Get Connected Data Sources (/api/data-sources)
     */
    async getDataSources() {
      return await this._request(window.ECOMLYTICS_CONFIG.ENDPOINTS.DATA_SOURCES);
    },

    /**
     * Connect or upload new data source
     */
    async connectDataSource(sourceData) {
      return await this._request(window.ECOMLYTICS_CONFIG.ENDPOINTS.DATA_SOURCES, {
        method: 'POST',
        body: sourceData
      });
    },

    /**
     * Disconnect data source
     */
    async disconnectDataSource(sourceId) {
      return await this._request(`${window.ECOMLYTICS_CONFIG.ENDPOINTS.DATA_SOURCES}/${sourceId}`, {
        method: 'DELETE'
      });
    },

    /**
     * Get Google Analytics GA4 overview (/api/analytics/ga4-overview)
     */
    async getGA4Overview() {
      return await this._request(window.ECOMLYTICS_CONFIG.ENDPOINTS.GA4_OVERVIEW);
    }

    ,
    async getAnalyticsStatus() {
      return await this._request(window.ECOMLYTICS_CONFIG.ENDPOINTS.ANALYTICS_STATUS);
    }
  };

  window.ECOMLYTICS_API = API;
})(window);
