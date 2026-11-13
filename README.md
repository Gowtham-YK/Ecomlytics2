# Ecomlytics — E-commerce Product Intelligence & Decision Platform

> **From Data → Insight → Decision**  
> A serious, production-grade frontend and analytics workspace built for real e-commerce businesses.

---

## 1. Overview & Principles

Ecomlytics unifies sales, product, customer segment, and funnel analytics into a decision-focused workspace.

- **No Fake / Demo Data:** The frontend contains zero hardcoded revenue, zero fabricated trend charts, zero mock customers, and zero synthetic funnels.
- **Backend Driven:** Every metric is obtained from the REST API endpoints.
- **Graceful States:** When backend data has not been ingested yet, polished empty states guide the user to connect a data source. When the API is unavailable, informative error states with retry mechanisms are presented.
- **Strict Monochrome Aesthetic:** Designed with a refined, high-end monochrome dark palette (`#050505` background, `#FFFFFF` typography, subtle grey surfaces, thin borders, and generous whitespace).

---

## 2. Directory Structure

```text
ECOMLYTICS_PRODUCT_ANALYTICS/
├── index.html                   # Public Marketing Website (Hero typewriter, Features, How It Works, Pricing, Trust, Team, CTA, Footer)
├── app.html                     # Application Workspace (Overview, Sales, Products, Customers, Funnel, Insights, Data Sources, Settings)
├── login.html                   # Dedicated Login View
├── signup.html                  # Multi-step Onboarding (Account → Welcome → Data Source → Workspace)
├── forgot-password.html         # Credential Recovery Flow
├── css/
│   ├── main.css                 # Monochrome color tokens, typography stacks, resets, utilities
│   ├── components.css           # Buttons, cards, tables, inputs, skeletons, empty/error states, modals, badges
│   ├── marketing.css            # Marketing header, typewriter intro, flow visualizers, feature cards, pricing tiers
│   ├── app.css                  # Sidebar navigation, topbar, view containers, pipeline bars, metric grids
│   └── responsive.css           # Breakpoints (1440px, 1280px, 1024px, 768px, 480px, 375px)
├── js/
│   ├── config.js                # Centralized configuration, API_BASE_URL, endpoints, pricing definitions
│   ├── api.js                   # Unified fetch client with timeouts, headers, and error normalization
│   ├── auth.js                  # Session storage, authentication helpers, and onboarding state
│   ├── typewriter.js            # Single-run natural typewriter effect with blinking cursor
│   ├── marketing.js             # Sticky header, mobile navigation drawer, contact modal, smooth scrolling
│   ├── app.js                   # Main application controller, view router, live health monitor, global sync
│   ├── dashboard.js             # Overview metrics, period filters, empty/error states for /api/overview
│   ├── sales.js                 # Sales analytics, backend-only revenue trends for /api/sales
│   ├── products.js              # Product intelligence, search, category filter, sorting, pagination for /api/products
│   ├── customers.js             # Customer intelligence, threshold segments (NEW, RETURNING, LOYAL, VIP, AT RISK) for /api/customers/segments
│   ├── funnel.js                # Conversion funnel (Views → Cart → Checkout → Purchase) for /api/funnel
│   ├── insights.js              # Rule-based diagnostic checkpoints and investigation points for /api/insights
│   ├── dataSources.js           # CSV file dropzone and Google Analytics (GA4) OAuth path for /api/data-sources
│   └── settings.js              # User profile, workspace preferences, API URL override, security disclosures
└── README.md
```

---

## 3. Backend API Route Specification

The frontend connects to the following FastAPI backend endpoints:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check and backend connection status |
| `/api/overview` | `GET` | Aggregated store metrics (revenue, orders, AOV, profit, margin, repeat rate, return rate) |
| `/api/products` | `GET` | Catalog performance table (SKU, revenue, margin, conversion rate, returns, rating) |
| `/api/customers/segments` | `GET` | Rule-based customer classifications (`NEW`, `RETURNING`, `LOYAL`, `VIP`, `AT RISK`) |
| `/api/funnel` | `GET` | Sequential funnel steps (Product Views → Add to Cart → Checkout → Purchase) |
| `/api/insights` | `GET` | Deterministic diagnostic checkpoints with prioritized investigation levers |
| `/api/data-sources` | `GET`, `POST` | Connected data feeds, CSV upload multipart form, sync triggers |
| `/api/analytics/ga4-overview`| `GET` | Google Analytics 4 session metrics and OAuth verification status |

---

## 4. Configuration & Development

### Changing the API Base URL
The API base URL defaults to `http://127.0.0.1:8000` (or the origin server if hosted together).
You can configure it at runtime in:
1. **The Application UI:** Navigate to `app.html#settings` → **API & Connection** tab. Enter any backend URL and click **Update API URL**.
2. **Via Code:** Edit `js/config.js` or define `localStorage.setItem('ECOMLYTICS_API_BASE_URL', 'https://your-api.com')`.

### Running Locally
You can preview the frontend by opening `index.html` in any browser, or serving the directory using any static web server:

**Using Python:**
```bash
python -m http.server 3000
```

**Using Node.js:**
```bash
npx serve .
```

**Using FastAPI StaticFiles:**
```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()
# mount frontend static files
app.mount("/", StaticFiles(directory=".", html=True), name="static")
```

---

## 5. Security & Privacy Disclosure

- OAuth access tokens for Google Analytics are kept in encrypted SQLite storage on the server.
- The frontend requests read-only reporting scopes (`analytics.readonly`).
- All customer identification records are processed locally or within isolated server memory without external tracking pixels.


## 6. Deploying the Full App on Render

The FastAPI service also serves the existing frontend files from the project root.
The public homepage is `index.html`; the application workspace is `app.html`.
API routes remain under `/api/*` and are registered before the frontend static-file mount.

### Render settings

- **Environment:** Python
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Health check path:** `/api/health`

The included `render.yaml` contains these settings for Render Blueprint deployment.
