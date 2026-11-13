# Analytics integrations (Ecomlytics2)

The app sends privacy-minimised product events from `app.html` to `POST /api/events`.
The backend independently forwards each event to the providers whose environment
variables are configured. A provider outage does not block the app.

## Render environment variables

Set these on the Ecomlytics2 Render web service, then redeploy:

- `GA4_MEASUREMENT_ID`: GA4 web stream Measurement ID (`G-...`).
- `MIXPANEL_PROJECT_TOKEN`: Mixpanel project token.
- `MIXPANEL_HOST`: `https://api.mixpanel.com` (US) or `https://api-eu.mixpanel.com` (EU).
- `POSTHOG_PROJECT_TOKEN`: PostHog Project API key (`phc_...`).
- `POSTHOG_HOST`: `https://us.i.posthog.com` for US PostHog projects; use the matching ingestion host for your region.
- `AMPLITUDE_API_KEY`: Amplitude Project API Key.
- `AMPLITUDE_INGEST_URL`: `https://api2.amplitude.com/2/httpapi` for US projects; use the matching endpoint for your region.

Never put secret service-account keys or personal API keys in frontend JavaScript.
The project tokens/API keys above are project-level ingestion identifiers.

## Events sent

- `page_view`
- `view_changed`
- `dashboard_viewed`
- `funnel_viewed`
- `customer_segments_viewed`

The `/api/events` endpoint currently allowlists these events. Add additional event names
there only when the corresponding user action is implemented. Passwords, emails, phone
numbers, authorization values and token-like properties are filtered before forwarding.

## Verify

1. Open Ecomlytics2 and sign in.
2. Navigate between Overview, Funnel and Customers.
3. Open `/api/analytics/status` on the deployed service to check environment configuration.
4. Check GA4 Realtime, Mixpanel Events/Live View, PostHog Activity > Live, and Amplitude
   Sources > Ingestion Debugger.

A `configured` status means the environment variable is present; only provider-side live
events confirm successful ingestion. GA4 Data API/OAuth reporting is not implemented by
this browser measurement integration.
