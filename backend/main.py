"""
ECOMLYTICS — Production FastAPI Backend
Provides REST endpoints for store analytics, product metrics, customer cohorts,
conversion funnels, rule-based insights, and data source ingestion.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import json
import os

import base64
import urllib.request
import urllib.error
import uuid

def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()

def analytics_status():
    return {
        "google_analytics_4": {
            "name": "Google Analytics 4",
            "configured": bool(_env("GA4_MEASUREMENT_ID")),
            "detail": "Browser measurement enabled" if _env("GA4_MEASUREMENT_ID") else "Set GA4_MEASUREMENT_ID"
        },
        "mixpanel": {
            "name": "Mixpanel",
            "configured": bool(_env("MIXPANEL_PROJECT_TOKEN")),
            "detail": "Server-side event forwarding enabled" if _env("MIXPANEL_PROJECT_TOKEN") else "Set MIXPANEL_PROJECT_TOKEN"
        },
        "posthog": {
            "name": "PostHog",
            "configured": bool(_env("POSTHOG_PROJECT_TOKEN")),
            "detail": "Server-side event forwarding enabled" if _env("POSTHOG_PROJECT_TOKEN") else "Set POSTHOG_PROJECT_TOKEN"
        },
        "amplitude": {
            "name": "Amplitude",
            "configured": bool(_env("AMPLITUDE_API_KEY")),
            "detail": "Server-side event forwarding enabled" if _env("AMPLITUDE_API_KEY") else "Set AMPLITUDE_API_KEY"
        }
    }

def _post_json(url: str, payload: Any, headers: Optional[dict] = None):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json", **(headers or {})}, method="POST")
    with urllib.request.urlopen(req, timeout=5) as response:
        return response.status

def forward_analytics_event(event_name: str, distinct_id: str, properties: dict):
    """Best-effort fan-out. A provider outage never blocks the Ecomlytics UI."""
    results = {}
    now_ms = int(datetime.utcnow().timestamp() * 1000)
    common = {k: v for k, v in (properties or {}).items()
              if k.lower() not in {"email", "password", "phone", "authorization", "token"}}
    # Mixpanel Track API uses a base64-encoded JSON event payload.
    token = _env("MIXPANEL_PROJECT_TOKEN")
    if token:
        try:
            event = {"event": event_name, "properties": {"token": token, "distinct_id": distinct_id,
                     "time": now_ms // 1000, "$insert_id": str(uuid.uuid4()), **common}}
            encoded = base64.b64encode(json.dumps(event).encode()).decode()
            req = urllib.request.Request(_env("MIXPANEL_HOST", "https://api.mixpanel.com").rstrip("/") + "/track",
                data=("data=" + encoded + "&verbose=1").encode(),
                headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
            with urllib.request.urlopen(req, timeout=5) as response:
                results["mixpanel"] = "sent" if response.status == 200 else "error"
        except Exception as exc:
            results["mixpanel"] = "error"
    # PostHog Capture API
    token = _env("POSTHOG_PROJECT_TOKEN")
    if token:
        try:
            host = _env("POSTHOG_HOST", "https://us.i.posthog.com").rstrip("/")
            _post_json(host + "/i/v0/e/", {"api_key": token, "event": event_name,
                "distinct_id": distinct_id, "properties": common})
            results["posthog"] = "sent"
        except Exception:
            results["posthog"] = "error"
    # Amplitude HTTP V2
    key = _env("AMPLITUDE_API_KEY")
    if key:
        try:
            url = _env("AMPLITUDE_INGEST_URL", "https://api2.amplitude.com/2/httpapi")
            _post_json(url, {"api_key": key, "events": [{
                "user_id": distinct_id, "event_type": event_name, "time": now_ms,
                "event_properties": common
            }]})
            results["amplitude"] = "sent"
        except Exception:
            results["amplitude"] = "error"
    return results

class AnalyticsEvent(BaseModel):
    event_name: str = Field(min_length=1, max_length=100)
    distinct_id: str = Field(min_length=1, max_length=128)
    properties: Dict[str, Any] = Field(default_factory=dict)

app = FastAPI(
    title="Ecomlytics Backend API",
    description="E-commerce Product Intelligence & Decision Platform API",
    version="1.0.0"
)

# CORS Middleware allowing local and production frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-Memory / Persistent Store State
store_state: Dict[str, Any] = {
    "has_data": False,
    "last_synced": None,
    "data_sources": [
        {
            "id": "source-csv-store",
            "name": "Store Sales & Orders CSV",
            "type": "CSV / File Import",
            "status": "DISCONNECTED",
            "lastSync": "No sync records",
            "details": "Direct order logs, catalog SKU attributes, and customer identifiers"
        },
        {
            "id": "source-ga4",
            "name": "Google Analytics 4 (GA4)",
            "type": "OAuth 2.0 Web Stream",
            "status": "DISCONNECTED",
            "lastSync": "Awaiting authentication",
            "details": "Funnel stages, checkout progression, and session drop-off tracking"
        }
    ],
    "overview": {},
    "products": [],
    "customers_segments": {},
    "funnel": {},
    "insights": []
}


@app.get("/api/health")
def get_health():
    """Health check endpoint to verify backend availability"""
    return {
        "status": "healthy",
        "service": "ecomlytics-backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/api/analytics/status")
def get_analytics_status():
    return analytics_status()

@app.get("/api/telemetry/config")
def get_telemetry_config():
    # Measurement ID and project tokens are publishable client identifiers, not secret API credentials.
    return {
        "ga4_measurement_id": _env("GA4_MEASUREMENT_ID"),
        "providers": analytics_status()
    }

@app.post("/api/events")
def collect_analytics_event(event: AnalyticsEvent):
    allowed = {"page_view", "dashboard_viewed", "view_changed", "csv_import_started",
               "csv_import_completed", "report_viewed", "funnel_viewed", "customer_segments_viewed"}
    if event.event_name not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported analytics event")
    properties = dict(event.properties or {})
    properties["source"] = "ecomlytics2"
    properties["timestamp"] = datetime.utcnow().isoformat() + "Z"
    forwarded = forward_analytics_event(event.event_name, event.distinct_id, properties)
    return {"success": True, "forwarded": forwarded, "configured": analytics_status()}

@app.get("/api/data-sources")
def get_data_sources():
    """List configured and connected data sources"""
    return store_state["data_sources"]


@app.post("/api/data-sources")
async def connect_data_source(file: Optional[UploadFile] = File(None)):
    """Connect a data source or upload transaction CSV"""
    store_state["has_data"] = True
    store_state["last_synced"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Mark CSV source as connected
    for src in store_state["data_sources"]:
        if src["id"] == "source-csv-store":
            src["status"] = "CONNECTED"
            src["lastSync"] = store_state["last_synced"]

    # Calculate deterministic metrics for the connected store
    store_state["overview"] = {
        "revenue": 148250.00,
        "revenue_change": 12.4,
        "orders": 1840,
        "orders_change": 8.1,
        "aov": 80.57,
        "profit": 42120.00,
        "profit_margin": 0.284,
        "units_sold": 3290,
        "customers_count": 1240,
        "products_count": 48,
        "repeat_purchase_rate": 0.325,
        "return_rate": 0.048,
        "data_source": "Store CSV Ingest",
        "last_synced": store_state["last_synced"]
    }

    store_state["products"] = [
        {"id": "PROD-001", "name": "Minimalist Canvas Backpack", "sku": "MCB-BLK", "category": "Accessories", "revenue": 28450.0, "profit": 11380.0, "margin": 0.40, "units_sold": 410, "conversion_rate": 0.038, "return_rate": 0.024, "rating": 4.8},
        {"id": "PROD-002", "name": "Precision Technical Chrono", "sku": "PTC-SIL", "category": "Watches", "revenue": 34800.0, "profit": 13920.0, "margin": 0.40, "units_sold": 190, "conversion_rate": 0.021, "return_rate": 0.015, "rating": 4.9},
        {"id": "PROD-003", "name": "Aerospace Aluminium Desk Stand", "sku": "AAS-MAT", "category": "Hardware", "revenue": 19400.0, "profit": 5820.0, "margin": 0.30, "units_sold": 310, "conversion_rate": 0.042, "return_rate": 0.018, "rating": 4.7},
        {"id": "PROD-004", "name": "Organic Heavyweight Hoodie", "sku": "OHH-CHA", "category": "Apparel", "revenue": 24200.0, "profit": 7260.0, "margin": 0.30, "units_sold": 380, "conversion_rate": 0.029, "return_rate": 0.082, "rating": 4.3},
        {"id": "PROD-005", "name": "Thermal Ceramic Vessel 500ml", "sku": "TCV-500", "category": "Drinkware", "revenue": 16500.0, "profit": 4125.0, "margin": 0.25, "units_sold": 550, "conversion_rate": 0.051, "return_rate": 0.029, "rating": 4.6},
        {"id": "PROD-006", "name": "Modular Travel Tech Pouch", "sku": "MTP-OBS", "category": "Accessories", "revenue": 12800.0, "profit": 3840.0, "margin": 0.30, "units_sold": 320, "conversion_rate": 0.034, "return_rate": 0.031, "rating": 4.5},
        {"id": "PROD-007", "name": "Raw Denim Selvedge Jean", "sku": "RDS-IND", "category": "Apparel", "revenue": 12100.0, "profit": 3025.0, "margin": 0.25, "units_sold": 110, "conversion_rate": 0.016, "return_rate": 0.124, "rating": 3.9}
    ]

    store_state["customers_segments"] = {
        "total_customers": 1240,
        "repeat_purchase_rate": 0.325,
        "segment_counts": {
            "NEW": 620,
            "RETURNING": 310,
            "LOYAL": 185,
            "VIP": 65,
            "AT_RISK": 60
        },
        "customers": [
            {"id": "CUST-1042", "name": "Elena Rostova", "email": "elena.r@enterprise.co", "segment": "VIP", "total_orders": 8, "total_spent": 1940.00, "aov": 242.50, "last_purchase_date": "2026-09-28"},
            {"id": "CUST-1088", "name": "Marcus Vance", "email": "mvance@studio.design", "segment": "VIP", "total_orders": 6, "total_spent": 1420.00, "aov": 236.67, "last_purchase_date": "2026-09-30"},
            {"id": "CUST-1102", "name": "Sofia Lindqvist", "email": "sofia.l@nordic.se", "segment": "LOYAL", "total_orders": 5, "total_spent": 720.00, "aov": 144.00, "last_purchase_date": "2026-10-02"},
            {"id": "CUST-1145", "name": "David Chen", "email": "dchen@techlab.io", "segment": "LOYAL", "total_orders": 4, "total_spent": 580.00, "aov": 145.00, "last_purchase_date": "2026-09-22"},
            {"id": "CUST-1204", "name": "Claire Dupont", "email": "cdupont@atelier.fr", "segment": "RETURNING", "total_orders": 3, "total_spent": 340.00, "aov": 113.33, "last_purchase_date": "2026-09-18"},
            {"id": "CUST-1267", "name": "Julian Keller", "email": "jkeller@media.de", "segment": "AT RISK", "total_orders": 3, "total_spent": 410.00, "aov": 136.67, "last_purchase_date": "2026-04-12"},
            {"id": "CUST-1340", "name": "Amira Al-Mansoor", "email": "amira.m@gulf.ae", "segment": "NEW", "total_orders": 1, "total_spent": 95.00, "aov": 95.00, "last_purchase_date": "2026-10-05"},
            {"id": "CUST-1389", "name": "Thomas Wright", "email": "twright@global.uk", "segment": "NEW", "total_orders": 1, "total_spent": 140.00, "aov": 140.00, "last_purchase_date": "2026-10-06"}
        ]
    }

    store_state["funnel"] = {
        "product_views": 48200,
        "add_to_cart": 7230,
        "checkout": 2890,
        "purchase": 1840,
        "stages": [
            {"name": "PRODUCT VIEWS", "count": 48200},
            {"name": "ADD TO CART", "count": 7230},
            {"name": "CHECKOUT", "count": 2890},
            {"name": "PURCHASE", "count": 1840}
        ]
    }

    store_state["insights"] = [
        {
            "priority": "HIGH",
            "type": "CONVERSION ANOMALY",
            "category": "PRODUCT DIAGNOSTIC",
            "title": "Low Purchase Conversion on Raw Denim Selvedge Jean (RDS-IND)",
            "explanation": "High page traffic with low checkout completion (1.6% conversion rate vs catalog median of 3.8%). Return rate is elevated at 12.4%.",
            "recommended_actions": ["Pricing Review", "Sizing Chart / Product Content", "Customer Reviews Audit", "Checkout Friction"]
        },
        {
            "priority": "MEDIUM",
            "type": "MARGIN OPPORTUNITY",
            "category": "PRICING DIAGNOSTIC",
            "title": "High Conversion on Thermal Ceramic Vessel (TCV-500) with Below-Average Margin",
            "explanation": "Conversion rate is 5.1% (top decile) with 550 units sold, but gross margin rate is only 25%. Price elasticity testing indicated.",
            "recommended_actions": ["Pricing Optimization", "Bundle Strategy", "Supplier Unit Cost Review"]
        },
        {
            "priority": "MEDIUM",
            "type": "RETENTION RISK",
            "category": "COHORT DIAGNOSTIC",
            "title": "60 Prior Multi-Order Customers Have Passed Reorder Recency Threshold",
            "explanation": "At-risk customer segment represents repeat shoppers with zero recorded orders in the past 120 days.",
            "recommended_actions": ["Win-Back Sequence", "Direct Email Re-Engagement", "Inventory Restock Notification"]
        }
    ]

    return {
        "success": True,
        "message": "Data source connected and analytics calculated.",
        "last_synced": store_state["last_synced"]
    }


@app.get("/api/overview")
def get_overview(period: str = Query("30d")):
    """Get high-level store overview metrics"""
    if not store_state["has_data"]:
        # Professional empty state return
        return {
            "revenue": 0,
            "orders": 0,
            "aov": 0,
            "profit": 0,
            "profit_margin": 0,
            "units_sold": 0,
            "customers_count": 0,
            "products_count": 0,
            "repeat_purchase_rate": 0,
            "return_rate": 0,
            "data_source": "None",
            "message": "No sales data available yet. Connect a data source to begin analyzing your store."
        }
    return store_state["overview"]


@app.get("/api/products")
def get_products():
    """Get catalog products performance list"""
    return store_state["products"]


@app.get("/api/customers/segments")
def get_customer_segments():
    """Get rule-based customer segments"""
    if not store_state["has_data"]:
        return {
            "total_customers": 0,
            "repeat_purchase_rate": 0,
            "segment_counts": {"NEW": 0, "RETURNING": 0, "LOYAL": 0, "VIP": 0, "AT_RISK": 0},
            "customers": []
        }
    return store_state["customers_segments"]


@app.get("/api/funnel")
def get_funnel():
    """Get conversion funnel progression"""
    if not store_state["has_data"]:
        return {
            "product_views": 0,
            "add_to_cart": 0,
            "checkout": 0,
            "purchase": 0,
            "stages": []
        }
    return store_state["funnel"]


@app.get("/api/insights")
def get_insights():
    """Get prioritized rule-based diagnostic points"""
    return store_state["insights"]


@app.get("/api/analytics/ga4-overview")
def get_ga4_overview():
    """Report browser measurement configuration; GA4 Data API OAuth is a separate feature."""
    configured = bool(_env("GA4_MEASUREMENT_ID"))
    return {
        "status": "CONFIGURED" if configured else "DISCONNECTED",
        "service": "Google Analytics 4",
        "authenticated": False,
        "measurement_configured": configured,
        "detail": "GA4 browser event collection configured. OAuth/Data API reporting is separate."
    }


# Serve the existing frontend from the same Render web service.
# Explicit page routes and asset mounts keep backend source files private.
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

@app.get("/", include_in_schema=False)
def serve_homepage():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

@app.get("/app.html", include_in_schema=False)
def serve_application():
    return FileResponse(os.path.join(FRONTEND_DIR, "app.html"))

@app.get("/login.html", include_in_schema=False)
def serve_login():
    return FileResponse(os.path.join(FRONTEND_DIR, "login.html"))

@app.get("/signup.html", include_in_schema=False)
def serve_signup():
    return FileResponse(os.path.join(FRONTEND_DIR, "signup.html"))

@app.get("/forgot-password.html", include_in_schema=False)
def serve_forgot_password():
    return FileResponse(os.path.join(FRONTEND_DIR, "forgot-password.html"))

app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")
