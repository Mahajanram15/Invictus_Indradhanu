# 🌈 Indradhanu (इंद्रधनुष)
> **AI-Powered Hyperlocal Climate & Agricultural Advisory Platform for Smallholder Farmers**

[![Deploy to GitHub Pages](https://github.com/Mahajanram15/Invictus_Indradhanu/actions/workflows/deploy.yml/badge.svg)](https://github.com/Mahajanram15/Invictus_Indradhanu/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-2D6A4F?style=flat&logo=github)](https://mahajanram15.github.io/Invictus_Indradhanu/)
[![Farmer App](https://img.shields.io/badge/Farmer_App-Live_Demo-2D6A4F?style=flat&logo=googlechrome)](https://mahajanram15.github.io/Invictus_Indradhanu/farmer/)
[![Backend Tests](https://img.shields.io/badge/Backend_Tests-10%20Passed-10B981?style=flat&logo=pytest)](https://github.com/Mahajanram15/Invictus_Indradhanu)
[![API Docs](https://img.shields.io/badge/API_Docs-Swagger_UI-blue?style=flat&logo=fastapi)](http://localhost:8000/docs)

---

## 🔗 Live Links

| Surface | Description | Link |
|---|---|---|
| 🖥️ **Operations Dashboard** | Web dashboard for the end-to-end advisory wizard, climate hub, farmers directory & audit history | [mahajanram15.github.io/Invictus_Indradhanu](https://mahajanram15.github.io/Invictus_Indradhanu/) |
| 📱 **Farmer App** | The farmer-facing mobile web app — language picker, advisory, climate, risk & farm plots (currently running in demo mode with built-in sample data) | [mahajanram15.github.io/Invictus_Indradhanu/farmer](https://mahajanram15.github.io/Invictus_Indradhanu/farmer/) |
| 💻 **Source Code** | This repository | [github.com/Mahajanram15/Invictus_Indradhanu](https://github.com/Mahajanram15/Invictus_Indradhanu) |

**Scan to open the farmer app on your phone:**

<img src="docs/qr-farmer-app.png" alt="QR code linking to the Indradhanu farmer app" width="180" />

---

## 📌 Executive Summary

Smallholder farmers cultivate over 70% of the food supply in developing regions, yet remain acutely vulnerable to convective weather shocks, unpredicted rainfall, and heat stress. 

**Indradhanu** bridges the gap between high-precision satellite meteorological data (**Open-Meteo & NASA POWER**) and smallholder field operations. Using AI agronomic reasoning, it translates raw atmospheric and 3-depth root-zone soil physics into direct, actionable farming recommendations delivered over accessible, zero-internet channels (**GSM Voice IVR, basic phone SMS, and WhatsApp**).

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       INDRADHANU FULL-STACK PLATFORM                    │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│     FRONTEND APPLICATION        │             │        BACKEND API ENGINE       │
│  React 18 • Vite • TypeScript   │             │  FastAPI (Async) • Python 3.10+ │
│  Tailwind CSS • Lucide Icons    │◄───────────►│  SQLAlchemy 2.0 • Pydantic v2   │
│  Supabase Auth (Phone OTP)      │  REST + JWT │  PostgreSQL (Supabase) + PostGIS│
│  Browser Geolocation GPS        │             │  Alembic Database Migrations    │
└─────────────────────────────────┘             └─────────────────────────────────┘
```

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Backend API**: Python 3.10+ (tested up to 3.14), FastAPI (Async ASGI), Pydantic v2.
- **Authentication**: Supabase Auth (Phone Number SMS OTP & JWT Bearer verification via PyJWT).
- **Database & Spatial GIS**: Supabase PostgreSQL with **PostGIS** extension for geographic coordinates & farm polygon boundaries (with transparent fallback to SQLite for zero-setup local testing).
- **ORM & Migrations**: SQLAlchemy 2.0 (asyncpg / psycopg3) and Alembic.
- **Testing**: `pytest`, `pytest-asyncio`, `httpx` (100% pass rate).

---

## 🚀 Step-by-Step Guide: Running the Project Locally

Follow these steps to run both the **FastAPI Backend** and the **React + Vite Frontend**.

### 1. Prerequisites
Ensure you have the following installed on your system:
- **Node.js** (v18.0 or newer) & `npm`
- **Python** (v3.10 or newer)
- **Git**

---

### Part A: Start the FastAPI Backend

Open a terminal and navigate to the project directory:

```bash
# 1. Navigate to the backend folder
cd backend

# 2. Create a virtual environment
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Set up environment variables
# Copy the example file to .env
# Windows (PowerShell):
Copy-Item .env.example .env
# Linux / macOS:
cp .env.example .env

# Note: By default, .env uses SQLite (indradhanu.db) for zero-setup local development.
# If connecting to your Supabase PostgreSQL database, fill in the DATABASE_URL and SUPABASE_JWT_SECRET in .env.

# 5. Run database migrations
# Windows (PowerShell):
.\venv\Scripts\alembic upgrade head
# Linux / macOS or activated venv:
alembic upgrade head

# 6. Start the FastAPI development server
# Windows (PowerShell):
.\venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Linux / macOS or activated venv:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be live at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Interactive Reference**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

---

### Part B: Start the React + Vite Frontend

Open a **second terminal** in the project root directory:

```bash
# 1. Install frontend dependencies
npm install

# 2. (Optional) Configure environment variables
# Copy .env.example to .env
# Windows (PowerShell):
Copy-Item .env.example .env
# Linux / macOS:
cp .env.example .env

# 3. Start the Vite development server
npm run dev
```

Open your browser at:
👉 **`http://localhost:3000`**

---

## 🧪 Running Automated Tests

### Backend Test Suite
The backend includes automated tests covering health checks, Supabase JWT verification, farmer registration, duplicate phone prevention, and farm ownership security:

```bash
cd backend
# Activate virtual environment if not already active
.\venv\Scripts\Activate.ps1   # (Windows)
# source venv/bin/activate     # (Linux/macOS)

pytest -v tests
```
*Result: 10 passed in ~2s.*

### Frontend Production Build Check
Ensure TypeScript compilation and Vite bundling succeed with zero errors:

```bash
npm run build
```

---

## 🔑 Supabase Configuration (Optional for Live Production SMS)

The application works out of the box with built-in presentation data and local database fallback. To enable **real carrier SMS OTPs** on live phone devices:

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com/) and create a new project.
2. **Enable Phone Authentication**:
   - Go to **Authentication** → **Providers** → **Phone**.
   - Enable Phone and configure your SMS Gateway provider (e.g., Twilio, MessageBird, Vonage).
3. **Configure Environment Keys**:
   - In root `.env`:
     ```ini
     VITE_API_BASE_URL="http://localhost:8000/api/v1"
     VITE_SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
     VITE_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
     ```
   - In `backend/.env`:
     ```ini
     DATABASE_URL="postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
     SYNC_DATABASE_URL="postgresql+psycopg://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres"
     SUPABASE_JWT_SECRET="[YOUR_JWT_SECRET_FROM_API_SETTINGS]"
     ```
   - Run migrations against Supabase: `alembic upgrade head`.

---

## 🌟 The 6-Step End-to-End Smallholder Journey

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  STEP 1: FARMER  │ ──► │   STEP 2: CROP   │ ──► │  STEP 3: AI RADAR│ ──► │  STEP 4: CLIMATE │ ──► │  STEP 5: ADVISORY│ ──► │  STEP 6: DELIVERY│
│  Profile, Phone  │     │  Visual Cards &  │     │  4-Phase Multi-  │     │  Weather, Soil & │     │  Action, Why,    │     │  Voice IVR, SMS  │
│  OTP & GPS Farm  │     │  Growth Stage    │     │  Step Reasoning  │     │  Risk Score Card │     │  When & Risk     │     │  & Push Receipt  │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

1. **Step 1: Farmer Profile & Farm Location**:
   - Phone-number-based signup/login via Supabase Auth OTP with support for Indian mobile numbers (`+91`).
   - Browser GPS sensor reading (`navigator.geolocation`) + manual village/district search.
   - PostGIS EPSG:4326 coordinate storage supporting multiple farm plots per farmer.
   - Dialect localization (*मराठी, हिन्दी, తెలుగు, Kiswahili, English*).
2. **Step 2: Visual Crop Selection**:
   - Select crops (Tomato 🍅, Rice 🌾, Wheat 🌱, Cotton ☁️, Maize 🌽, Sugarcane 🎋) and phenological growth stages (*Flowering, Growing, Planting*).
3. **Step 3: AI Radar Processing**:
   - 4-phase reasoning engine analyzing satellite grid telemetry and root-zone moisture metrics.
4. **Step 4: Climate Intelligence Layer**:
   - Real-time temperature, 7-day weather timeline, root hydration status (transparent in-situ probe availability), and composite phenological risk score evaluated via ICAR/FAO biophysical rules.
5. **Step 5: Actionable Recommendation ("YOUR FARMER ADVISORY")**:
   - **Immediate Action**: *"Delay irrigation for 24 hours."*
   - **Why It Matters**: *"Rain is likely in the next 24 hours and soil moisture is currently adequate. Irrigating now may cause waterlogging."*
   - **Recommended Timing**: *"Reassess tomorrow morning."*
   - **Risk If Ignored**: *"Possible waterlogging and root-zone nutrient loss."*
6. **Step 6: Last-Mile Delivery Channels**:
   - 📞 **Voice Call (GSM IVR)** with interactive waveform and native audio player.
   - 💬 **Feature Phone SMS** on realistic phone frame with 160-character counter.
   - 📱 **Mobile App Push & WhatsApp** notification.
   - **Verified Receipt**: *"Rain expected tomorrow. Delay irrigation by 24 hours."*

---

## 🎯 Presentation Mode

The application includes a built-in **Presentation Mode** designed for hackathon pitches, slides, and projector displays:
- Click the **"Presentation Mode"** toggle in the top bar (or press `Escape` to toggle).
- Hides sidebars for clean, full-width screen sharing.
- Use keyboard arrows (`←` Left, `→` Right) to step through slides seamlessly.

---

## 📄 License
MIT © 2026 Indradhanu Team. Built with ❤️ for Smallholder Farmers.
