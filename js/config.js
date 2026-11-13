/**
 * ECOMLYTICS — Centralized Application & API Configuration
 * Production-ready environment settings and endpoint definitions
 */

(function (window) {
  'use strict';

  // Determine base API URL:
  // 1. Check localStorage for developer/environment override
  // 2. Check if served over http(s) from a server with API
  // 3. Fallback to standard FastAPI local development server (http://127.0.0.1:8000)
  const storedApiUrl = localStorage.getItem('ECOMLYTICS_API_BASE_URL');
  let defaultApiUrl = 'http://127.0.0.1:8000';
  
  if (window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file://')) {
    // If hosted together with FastAPI backend
    defaultApiUrl = window.location.origin;
  }

  const CONFIG = {
    APP_NAME: 'Ecomlytics',
    VERSION: '1.0.0',
    API_BASE_URL: storedApiUrl || defaultApiUrl,
    
    // Explicit API Route Definitions matching Ecomlytics backend architecture
    ENDPOINTS: {
      HEALTH: '/api/health',
      OVERVIEW: '/api/overview',
      PRODUCTS: '/api/products',
      CUSTOMERS_SEGMENTS: '/api/customers/segments',
      FUNNEL: '/api/funnel',
      INSIGHTS: '/api/insights',
      DATA_SOURCES: '/api/data-sources',
      GA4_OVERVIEW: '/api/analytics/ga4-overview',
      ANALYTICS_STATUS: '/api/analytics/status'
    },
    
    // Request timeout in milliseconds
    REQUEST_TIMEOUT_MS: 8000,
    
    // Editable Pricing Variables (free of fabricated marketing claims)
    PRICING: {
      FREE: {
        NAME: 'FREE',
        PRICE: '$0',
        PERIOD: '/month',
        BADGE: null,
        FEATURES: [
          'Core store overview metrics',
          'Standard product performance table',
          'Basic rule-based customer segments',
          'Single CSV data source connection',
          'Manual data refresh'
        ]
      },
      PRO: {
        NAME: 'PRO',
        PRICE: '$49',
        PERIOD: '/month',
        BADGE: 'RECOMMENDED',
        FEATURES: [
          'Full product & conversion analytics',
          'Advanced segment threshold rules',
          'Prioritized rule-based business insights',
          'Full conversion funnel tracking',
          'Google Analytics (GA4) integration',
          'Automated daily synchronization'
        ]
      },
      BUSINESS: {
        NAME: 'BUSINESS',
        PRICE: '$149',
        PERIOD: '/month',
        BADGE: null,
        FEATURES: [
          'Multi-store workspace support',
          'Team role management & access control',
          'Expanded historical analysis range',
          'Direct API & custom webhook ingest',
          'Encrypted OAuth token management',
          'Priority technical support'
        ]
      }
    },
    
    // Helper to update base URL at runtime (e.g. from Settings UI)
    setApiBaseUrl: function (url) {
      if (url) {
        const cleaned = url.replace(/\/+$/, '');
        localStorage.setItem('ECOMLYTICS_API_BASE_URL', cleaned);
        this.API_BASE_URL = cleaned;
      } else {
        localStorage.removeItem('ECOMLYTICS_API_BASE_URL');
        this.API_BASE_URL = defaultApiUrl;
      }
    }
  };

  window.ECOMLYTICS_CONFIG = CONFIG;
})(window);
