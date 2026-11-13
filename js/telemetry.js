/**
 * Ecomlytics2 analytics telemetry.
 * Sends privacy-minimised events to the backend, which forwards them to
 * Mixpanel, PostHog and Amplitude. GA4 uses the official gtag browser tag.
 */
(function (window) {
  'use strict';
  const cfg = window.ECOMLYTICS_CONFIG || {};
  const base = (cfg.API_BASE_URL || window.location.origin).replace(/\/+$/, '');
  const idKey = 'ecomlytics2_analytics_distinct_id';
  let distinctId = localStorage.getItem(idKey);
  if (!distinctId) {
    distinctId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
      'anon-' + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem(idKey, distinctId);
  }

  function send(eventName, properties) {
    const payload = {
      event_name: eventName,
      distinct_id: distinctId,
      properties: Object.assign({
        page_path: window.location.pathname,
        page_title: document.title,
        app_version: '1.0.0'
      }, properties || {})
    };
    fetch(base + '/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
    if (window.gtag) {
      window.gtag('event', eventName, payload.properties);
    }
  }

  async function init() {
    try {
      const response = await fetch(base + '/api/telemetry/config');
      if (response.ok) {
        const config = await response.json();
        if (config.ga4_measurement_id) {
          const script = document.createElement('script');
          script.async = true;
          script.src = 'https://www.googletagmanager.com/gtag/js?id=' +
            encodeURIComponent(config.ga4_measurement_id);
          document.head.appendChild(script);
          window.dataLayer = window.dataLayer || [];
          window.gtag = function () { window.dataLayer.push(arguments); };
          window.gtag('js', new Date());
          window.gtag('config', config.ga4_measurement_id, { send_page_view: false });
        }
      }
    } catch (_) {}
    send('page_view');
    if (!window.location.hash || window.location.hash === '#overview') send('dashboard_viewed');
  }

  window.ECOMLYTICS_ANALYTICS = {
    track: send,
    getDistinctId: () => distinctId
  };

  window.addEventListener('hashchange', function () {
    send('view_changed', { view: window.location.hash.replace(/^#/, '') || 'overview' });
    if (!window.location.hash || window.location.hash === '#overview') send('dashboard_viewed');
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
