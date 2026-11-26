# PRITHON MDM ENTERPRISE — MASTER FRONTEND DESIGN SYSTEM & FEATURE SPECIFICATION (HINGLISH EDITION)

> **DOCUMENT VERSION**: 5.0.0 Enterprise Scalefusion-Standard (Hinglish Detailed Guide)  
> **PURPOSE**: Is document me aapki Puri Website, Dashboard, Har Page, Modal, Drawer, Table Columns, Buttons, Telemetry, CRUD Operations aur Android DPC Hooks ko simple aur detailed **Hinglish** me explain kiya gaya hai, taaki design update karte waqt ek bhi feature na chhoote.

---

## TABLE OF CONTENTS (VISHAY SUCHI)
1. [Core Architecture & System Ka Concept](#1-core-architecture--system-ka-concept)
2. [Master Design System, Colors & Theme Tokens](#2-master-design-system-colors--theme-tokens)
3. [Global Shell & Screen Ka Layout](#3-global-shell--screen-ka-layout)
4. [Page 1: Landing Page / Public Storefront (`index.html`)](#4-page-1-landing-page--public-storefront-indexhtml)
5. [Page 2: Retailer Login Gateway (`login.html`)](#5-page-2-retailer-login-gateway-loginhtml)
6. [Page 3: New Shop Onboarding & KYC (`signup.html`)](#6-page-3-new-shop-onboarding--kyc-signuphtml)
7. [Page 4: Master Fleet Dashboard (`dashboard.html`)](#7-page-4-master-fleet-dashboard-dashboardhtml)
   - [7.1 Top Sticky Header (64px)](#71-top-sticky-header-64px)
   - [7.2 Left Navigation Sidebar (260px)](#72-left-navigation-sidebar-260px)
   - [7.3 Scalefusion Top 4 Metric KPI Cards](#73-scalefusion-top-4-metric-kpi-cards)
   - [7.4 Filter Toolbar & Search Bar](#74-filter-toolbar--search-bar)
   - [7.5 Scalefusion Master Fleet Table (View A)](#75-scalefusion-master-fleet-table-view-a)
   - [7.6 Visual Grid Cards View (View B)](#76-visual-grid-cards-view-view-b)
   - [7.7 Deep Device Inspector Drawer (540px Slide-Sheet)](#77-deep-device-inspector-drawer-540px-slide-sheet)
     - [Tab 1: Hardware & OS Telemetry](#tab-1-hardware--os-telemetry)
     - [Tab 2: Customer & Borrower KYC](#tab-2-customer--borrower-kyc)
     - [Tab 3: Live GPS Radar & Maps](#tab-3-live-gps-radar--maps)
     - [Tab 4: Installed App Inventory](#tab-4-installed-app-inventory)
     - [Tab 5: Security & Emergency Controls](#tab-5-security--emergency-controls)
   - [7.8 Sidebar ke Dedicated Workspace Modules](#78-sidebar-ke-dedicated-workspace-modules)
     - [Module 1: Live GPS Radar & Map View](#module-1-live-gps-radar--map-view)
     - [Module 2: EMI Repayments & Auto-Dunning Ledger](#module-2-emi-repayments--auto-dunning-ledger)
     - [Module 3: 6-Tap QR Provisioning Station](#module-3-6-tap-qr-provisioning-station)
     - [Module 4: Kiosk Policy & Lockscreen Customizer](#module-4-kiosk-policy--lockscreen-customizer)
     - [Module 5: 0-KB Silent Cellular SMS Hub](#module-5-0-kb-silent-cellular-sms-hub)
     - [Module 6: Webhooks, REST API & Database Status](#module-6-webhooks-rest-api--database-status)
   - [7.9 Modals & Popups](#79-modals--popups)
8. [Page 5: Privacy Policy (`privacy.html`)](#8-page-5-privacy-policy-privacyhtml)
9. [Page 6: Master Terms of Service (`terms.html`)](#9-page-6-master-terms-of-service-termshtml)
10. [Android DPC App Ka Hardware Lock Mechanism](#10-android-dpc-app-ka-hardware-lock-mechanism)
11. [Complete Database Schema (PostgreSQL Tables)](#11-complete-database-schema-postgresql-tables)
12. [CRUD Operations Ka Pura Matrix](#12-crud-operations-ka-pura-matrix)
13. [WebSocket Realtime Events (Socket.io)](#13-websocket-realtime-events-socketio)
14. [Exhaustive REST API Endpoints](#14-exhaustive-rest-api-endpoints)

---

## 1. CORE ARCHITECTURE & SYSTEM KA CONCEPT

Prithon MDM Enterprise ek aisa system hai jo smartphone financing (EMI par mobile bechne wale dukandaaro aur NBFCs) ke liye banaya gaya hai.

### Problem Kya Hoti Hai:
Jab koi customer EMI par naya phone leta hai aur baad me paise nahi bharta, toh wo:
1. Internet (Wi-Fi aur Mobile Data) band kar deta hai taaki lock command na aaye.
2. Recovery mode (Volume Up + Power) me jaake phone ko Hard Reset karne ki koshish karta hai.
3. Computer se connect karke USB Debugging / ADB se lock app delete karne ki koshish karta hai.
4. SIM card nikal deta hai ya Safe Mode me phone boot karta hai.

### Prithon Ka Hardware-Level Solution:
- **Device Owner Authority**: Naye phone ko setup karte waqt 6-tap QR scan se DPC ko root-level ki authority mil jaati hai (bina phone root kiye).
- **Factory Reset Protection (FRP)**: Phone ko recovery mode se format karne par bhi phone dukaandar ki id ke bina unlock nahi hoga.
- **Direct Boot Protection**: Phone restart hote hi bina password dale sabse pehle Prithon lock screen aa jaati hai.
- **0-KB Silent Cellular SMS**: Agar customer ne internet band kar diya, toh server phone par ek hidden encrypted SMS bhejta hai aur phone bina internet ke turant lock ho jata hai.
- **Automated Payment Webhook**: Jaise hi customer Razorpay / Cashfree / UPI par payment karta hai, phone 1 second ke andar apne aap unlock ho jata hai.

---

## 2. MASTER DESIGN SYSTEM, COLORS & THEME TOKENS

Pura dashboard **Scalefusion Minimalist Monochrome** standard par design kiya gaya hai:

### Color Palette (Rango Ka System):
- **Background Canvas (`--bg-app`)**: `#F8FAFC` (Saaf halka slate background).
- **Cards & Surfaces (`--bg-surface`)**: `#FFFFFF` (Pure White).
- **Sidebar (`--bg-sidebar`)**: `#09090B` (High-density Obsidian Black).
- **Active Navigation (`--bg-sidebar-hover`)**: `#18181B`.
- **Text Main (`--text-main`)**: `#0F172A` (Bold deep slate black).
- **Text Muted (`--text-muted`)**: `#64748B` (Subtle gray text).
- **Border Lines (`--border`)**: `#E2E8F0`.

### Functional Status Colors:
- **Green (Normal / Unlocked / Online)**: `#10B981` (Background: `#ECFDF5`).
- **Red (Kiosk Locked / Danger / Default)**: `#EF4444` (Background: `#FEF2F2`).
- **Yellow (Warning / Low Battery / Pending)**: `#F59E0B` (Background: `#FFFBEB`).
- **Blue (Primary Action / Inspect)**: `#2563EB` (Background: `#EFF6FF`).

---

## 3. GLOBAL SHELL & SCREEN KA LAYOUT

Har ek authenticated screen par 3 main hisse hote hain:
1. **Left Sidebar (260px)**: Dukaandar ki shop ka naam, logo, aur 8 main menu items.
2. **Top Sticky Bar (64px)**: Current page title, global search bar (`⌘K`), shop ID badge, live green socket dot, aur quick buttons.
3. **Main Content Canvas**: Yahan saare metric cards, table, maps aur drawers khulte hain.
4. **Slide-out Side Sheet (540px Drawer)**: Kisi bhi phone par "Inspect" dabane par right side se slide hoke khulne wala panel.

---

## 4. PAGE 1: LANDING PAGE / PUBLIC STOREFRONT (`index.html`)

Yeh aapki main website ka front page hai jahan naye dukaandar aake features dekhte hain:

1. **Top Navbar**:
   - Prithon Shield Logo aur Brand Name.
   - Menu Links: Features, Architecture, EMI Calculator, Pricing, Documentation.
   - Action Buttons: `Login` aur `Onboard Store (Free Trial)`.
2. **Hero Section**:
   - Tagline: "⚡ ZERO-TAMPER HARDWARE LOCK FOR SMARTPHONE FINANCING".
   - Badi Heading: "Recover 100% of Smartphone EMIs with Hardware-Grade DPC Enforcement."
   - Sub-heading: Android 9 se lekar 16 tak full support, offline SMS lock, auto-dunning.
   - Buttons: "Start 14-Day Free Trial" aur "Launch Simulator".
   - **Live Fleet Counter Ticker**:
     - 12,450+ Managed Handsets
     - ₹18.4 Crore Capital Protected
     - 99.8% Recovery Rate
     - < 400ms Lock Dispatch Speed
3. **6 Main Feature Cards**:
   - Unbypassable Kiosk Lockscreen (Safe Mode aur notification bar block).
   - 0-KB Silent Cellular SMS Gateway (Bina internet lock).
   - Automated EMI Dunning & Webhook Sync (UPI payment par auto unlock).
   - Interactive 6-Tap QR Provisioning (45 second me setup).
   - Real-time GPS Radar & Anti-Theft Geofence.
   - In-Place Silent App Updates (Bina format kiye app update).
4. **Interactive EMI Calculator**:
   - Sliders: Loan Amount (₹5,000 to ₹1,50,000), Down Payment %, Tenure (3 to 24 Months), Interest Rate.
   - Live Results: Monthly EMI amount, Total Interest, and Money Saved with MDM.
5. **Comparison Table**: Prithon MDM vs Scalefusion vs Samsung Knox Guard vs Normal App Lockers.
6. **Footer**: Privacy Policy, Terms, RBI Fair Practice Guidelines, Copyright.

---

## 5. PAGE 2: RETAILER LOGIN GATEWAY (`login.html`)

Dukaandar aur unke staff ke login karne ka page:

1. **Brand Header**: Prithon Obsidian Shield Logo.
2. **Form Fields**:
   - **Shop Code / Tenant ID**: Dukaandar ka unique code (Jaise `ALH-9565`).
   - **Username / Email**: Store admin ka username ya email address.
   - **Master Password**: Password input field with show/hide eye icon.
   - **Remember Me Checkbox**: JWT token ko browser me save rakhne ke liye.
3. **1-Click Quick Demo Fill Button**:
   - Ek click me test credentials auto-fill ho jaate hain (`Tenant: ALH-9565`, `User: alhajkhan`, `Pass: admin123`).
4. **Submit Button**: "Authenticate & Enter Cockpit".
   - Click karne par loading spinner aata hai aur verify hone par `/dashboard` par bhej deta hai.

---

## 6. PAGE 3: NEW SHOP ONBOARDING & KYC (`signup.html`)

Nayi dukan register karne ka 3-step form:

- **Step 1: Store & Entity Information**:
  - Dukan ka pura naam (Business Name).
  - Unique Shop Code pasand karne ka option (e.g. `ALH-9565`).
  - GSTIN ya Shop Act Number (Optional).
  - Dukan ka pura pata aur City.
- **Step 2: Proprietor / Administrator Identity**:
  - Dukaandar ka pura legal naam.
  - Mobile Number aur 6-digit OTP verification button.
  - Official Email Address.
  - Master Password aur Confirm Password.
- **Step 3: Fleet Scale & Plan Selection**:
  - Starter Plan (Up to 25 Devices) — Free testing ke liye.
  - Retail Pro (Up to 250 Devices) — Normal mobile shops ke liye.
  - Enterprise NBFC (Unlimited Devices) — Badi finance companies ke liye.
- **Submission**: Direct database tenant create hota hai aur dashboard open hota hai.

---

## 7. PAGE 4: MASTER FLEET DASHBOARD (`dashboard.html`)

Yeh aapka main operating room hai jahan se saare phone control hote hain:

### 7.1 TOP STICKY HEADER (64px)
- **Current View Breadcrumb**: Dikhaata hai ki abhi kaunsa module khula hai (e.g., `Fleet Cockpit`).
- **Global Omnibar Search Box (`⌘K`)**:
  - Box me customer ka naam, phone number, IMEI, ya phone model likhte hi table live filter ho jaati hai (150ms debounce ke saath).
- **Shop ID Badge**: `🏢 Shop: ALH-9565`.
- **WebSocket Realtime Pulse Dot**:
  - 🟢 **Green (Connected)**: Server se live connection hai.
  - 🟡 **Yellow (Reconnecting)**: Dubara connect ho raha hai.
  - 🔴 **Red (Offline)**: Disconnected.
- **Quick Action Buttons**:
  - `+ Enroll Handset`: Naya phone manually register karne ka modal kholta hai.
  - `6-Tap QR`: Naye phone ko 45 second me scan karke jodane ka QR kholta hai.
  - `Sync Fleet`: Saare phones ka latest data refresh karta hai.
- **User Avatar & Sign Out**: Initial badge (e.g., `A`) aur logout button.

---

### 7.2 LEFT NAVIGATION SIDEBAR (260px)
- **Top Brand**: Prithon Logo, Version `v1.3.0 Enterprise`, aur Dukan ka naam (`Alhaj Telecom`).
- **8 Main Navigation Modules**:
  1. 🚀 **Fleet Cockpit**: Main phone inventory table aur cards.
  2. 📡 **Live GPS Radar**: Full-screen interactive map.
  3. ⚡ **6-Tap QR Station**: Android Enterprise QR generator.
  4. 💳 **EMI & Repayments**: Loan ledger aur overdue repayment tracker.
  5. 💬 **0-KB Silent SMS Hub**: Bina internet SMS se lock bhejne ka tool.
  6. 🛡️ **Kiosk & App Lock**: Lock screen customize karne aur buttons disable karne ki policy.
  7. 📦 **App Inventory**: Phone ke andar ke apps dekhne aur block karne ka modal.
  8. 🔌 **Webhooks & API**: Razorpay auto-unlock URL aur database health.
- **Sidebar Footer**: Current Server Toggle (Localhost vs Render Cloud).

---

### 7.3 SCALEFUSION TOP 4 METRIC KPI CARDS
1. **Total Managed Fleet**: Total kitne phone register hain (e.g., `1`). Niche `1 Device Owner Armed` badge.
2. **Real-Time Online**: Kitne phone abhi live internet se jude hain (🟢 Green text).
3. **Kiosk Locked Defaults**: Kitne phone abhi EMI default ya siren ki wajah se locked hain (🔴 Red text).
4. **Normal / Repaying**: Kitne phone regular chal rahe hain aur unlock hain.

---

### 7.4 FILTER TOOLBAR & SEARCH BAR
- **Filter Pills**:
  - `All Fleet`: Saare phone dikhao.
  - `🟢 Online`: Sirf live connected phone dikhao.
  - `🔴 Kiosk Locked`: Sirf locked phone dikhao.
  - `Unlocked`: Sirf unlocked phone dikhao.
  - `Offline`: Jo phone abhi offline hain.
- **View Toggle Buttons**:
  - `Table View`: Scalefusion standard data table.
  - `Grid Cards View`: Bade visual cards har phone ke liye.

---

### 7.5 SCALEFUSION MASTER FLEET TABLE (VIEW A)
Table ke 7 Columns:
1. **DEVICE / MODEL**: Brand ka logo (itel/Samsung/etc.), Model name (e.g. `itel C672N`), aur Android version badge (`Android 16`).
2. **IMEI & HARDWARE**: Monospace hardware IMEI number, 1-click copy icon, dual-SIM status.
3. **CUSTOMER / KYC**: Grahak ka pura naam, click-to-call mobile number, aur Loan ID chip.
4. **BATTERY & VITALS**: Animated dynamic battery progress bar (Hara > 50%, Peela 20-50%, Laal < 20%) aur charging lightning bolt.
5. **CONNECTIVITY**: Live Socket Dot (`🟢 Online` / `⚪ Offline`) aur Local/Wi-Fi IP address.
6. **SECURITY STATE**: Status Badge (`🔒 LOCKED` ya `🔓 NORMAL`) aur Device Owner shield tag.
7. **ACTIONS (Quick Control Buttons)**:
   - `🔒 Lock`: Phone par turant lock bhejta hai (< 400ms me screen lock).
   - `🔓 Unlock`: Phone ko turant unlock karke normal screen wapas lata hai.
   - `👁️ Inspect`: Right side se 540px ka detail side drawer kholta hai.

---

### 7.6 VISUAL GRID CARDS VIEW (VIEW B)
- 3-Column responsive card grid.
- Har card par bada model name, online status dot, customer name, battery bar, aur large status indicator (`🔒 KIOSK LOCKED` ya `🔓 FLEET ACTIVE`) hota hai.

---

### 7.7 DEEP DEVICE INSPECTOR DRAWER (540px SLIDE-SHEET)
Jab table me kisi phone par **Inspect** dabate hain, toh right side se yeh drawer khulta hai:

- **Top Bar**: Phone ka naam, Device ID, Quick Lock button, Quick Unlock button, aur Close (`✕`) button.
- **5 Navigation Tabs**:

#### Tab 1: Hardware & OS Telemetry
- Hardware IMEI (1-click copy).
- Android OS Version aur SDK level.
- Battery percentage, temperature aur health.
- Device Owner enforcement status (`Active & Enforced`).
- Last seen timestamp (Kitne minute pehle connect tha).
- Current status (`LOCKED` ya `NORMAL`).

#### Tab 2: Customer & Borrower KYC
- Borrower Full Name.
- Primary Mobile Number (Click to Call & Direct WhatsApp link).
- Alternative Emergency Number.
- Masked Aadhaar Card Number.
- Store Bill / Invoice Number.
- Loan Account ID aur Monthly EMI Amount.

#### Tab 3: Live GPS Radar & Maps
- Decimal Latitude & Longitude (e.g., `21.1292° N, 72.8286° E`).
- GPS accuracy radius (e.g., `Accurate within 15 meters`).
- **Interactive Mini-Map**: Location pin ke saath.
- **"Open in Google Maps" Button**: Ek click me Google Maps me exact rasta kholta hai.
- **"Request Fresh GPS Fix" Button**: Phone se fresh location mangwata hai.

#### Tab 4: Installed App Inventory
- Phone me user ke jitne bhi apps installed hain (WhatsApp, YouTube, etc.) unki live list.
- Har app ke aage `Disable App` aur `Uninstall App` ka remote button.

#### Tab 5: Security & Emergency Controls
- 🚨 **Trigger Remote Siren**: Phone par tez alarm bajata hai bhale hi phone silent par ho.
- 📸 **Remote Security Selfie**: Unauthorized aadmi ki photo kheenchne ka signal bhejta hai.
- 🔄 **Reboot Phone**: Phone ko remotely restart karta hai.
- ⚠️ **Remote Factory Wipe**: Phone ko complete format karta hai (Master password maangta hai).
- 🗑️ **Permanent Unenroll & Delete**: DPC permissions hata ke phone ko tenant database se delete karta hai.

---

### 7.8 SIDEBAR KE DEDICATED WORKSPACE MODULES

#### Module 1: Live GPS Radar (`panel-map`)
- Full-screen map jahan dukan ke saare phone ek saath dikhte hain.
- Green markers (Normal phones), Red markers (Locked phones).
- Geofence tool: Map par border khainch kar rule laga sakte hain ki agar phone shahar se bahar nikle toh turant auto-lock ho jaye.

#### Module 2: EMI Repayments & Auto-Dunning Ledger (`panel-financing`)
- **Portfolio Summary**: Total kitne rupaye ka loan diya, kitna collect hua, kitna baaki hai.
- **Financing Table**: Customer, IMEI, EMI amount, Due Date, aur Status (`PAID`, `PENDING`, `OVERDUE`).
- **Auto-Dunning Rules**:
  - T-3 Days: Due date se 3 din pehle polite WhatsApp/SMS payment reminder.
  - Due Date: Screen par gentle alert.
  - Grace Period Expiry: Har 2 ghante me warning popup.
  - Default (T+3 Days): **Raat ko 12:01 AM par phone automatic hardware lock ho jayega.**
- **Manual Payment Button**: "Mark Cash Payment Received" dabate hi phone turant unlock ho jata hai.

#### Module 3: 6-Tap QR Provisioning Station (`panel-provisioning`)
- Naye dabbe-pack phone ko setup karne ka station:
  1. Naya phone on karein.
  2. Pehli "Welcome" screen par blank space par 6 baar jaldi-jaldi tap karein.
  3. Camera scanner khul jayega.
  4. Is station ka QR code scan karein.
  5. Phone bina computer ke 45 second me DPC install karke dukan se bind ho jayega.
- Dukan ka Wi-Fi name aur password QR me pre-fill karne ka option.
- Printable floor card print karne ka button.

#### Module 4: Kiosk Policy & Lockscreen Customizer (`panel-policies`)
- Defaulting customer ke phone par kaisa lock screen dikhega, wo yahan customize hota hai:
  - Dukan ka naam aur heading.
  - Warning notice message.
  - Helpline mobile number (Emergency call allow rehti hai).
  - Dukaandar ka UPI QR code upload karne ka option (Grahak wahi scan karke turant pay kar sake).
- **Hardware Lockdown Toggles**:
  - Power Off menu disable karein (Phone switch off nahi hoga).
  - Notification bar pull-down disable karein (Wi-Fi band nahi kar payega).
  - USB Debugging disable karein (Computer se connect nahi hoga).
  - Safe Mode disable karein.
- Side me live smartphone mockup me real-time preview dikhta hai.

#### Module 5: 0-KB Silent Cellular SMS Hub (`panel-sms`)
- Jab grahak internet band kar deta hai:
  - Phone number aur command select karein (`LOCK`, `UNLOCK`, `SIREN`, `GET_LOCATION`).
  - "Dispatch 0-KB Encrypted SMS" dabayein.
  - Phone par hidden background SMS jayega aur phone bina internet ke lock ho jayega.

#### Module 6: Webhooks, REST API & Database Status (`panel-webhooks`)
- Razorpay / Cashfree webhook URL: `https://your-domain.com/api/webhook/payment-received`.
- Webhook aate hi phone automatically unlock ho jata hai.
- PostgreSQL database connection pool aur health indicator.

---

### 7.9 MODALS & POPUPS
1. **Device Enrollment Modal**: IMEI 1, IMEI 2, Serial, Customer Name, Phone, Alt Phone, Loan ID, EMI amount bharne ka form.
2. **Apps Inventory Modal**: Saare apps search aur manage karne ka modal.
3. **Emergency Factory Wipe Confirmation**: Master password daal kar wipe confirm karne ka safety popup.
4. **Device Unenroll & Release Confirmation**: Loan pura hone par phone ko permanently release karne ka dialog.

---

## 8. PAGE 5: PRIVACY POLICY (`privacy.html`)
- Google Android Enterprise aur RBI Digital Lending regulations ke mutabiq legal disclosures.
- Device Admin, Overlay Window, Accessibility, aur Location permissions ka legitimate reason.

---

## 9. PAGE 6: MASTER TERMS OF SERVICE (`terms.html`)
- Smartphone tab tak dukaandar ka hypothecated collateral rehta hai jab tak aakhri EMI pay na ho jaye.
- Customer ka remote lockdown ke liye contractual consent.
- Emergency services (112, 100, 108) hamesha enabled rehne ki guarantee.

---

## 10. ANDROID DPC APP KA HARDWARE LOCK MECHANISM

Android DPC app (`com.prithon.dpc`) phone ke andar kaise kaam karta hai:
- `PrithonAdminReceiver`: Device Owner intents aur FRP rules sambhalta hai.
- `MdmForegroundService`: 24x7 background me chalta hai, server se socket connection rakhta hai, aur heartbeat bhejta hai.
- `DeviceLockManager`: Screen par full-screen unbypassable overlay banata hai (`TYPE_APPLICATION_OVERLAY`), status bar aur power off rokta hai.
- `AppUpdateManager`: Jab bhi aap naya APK compile karte hain, bina phone reset kiye silent in-place update kar deta hai.

---

## 11. COMPLETE DATABASE SCHEMA (POSTGRESQL TABLES)
- `tenants`: Shop ID, Dukan ka naam, owner phone, email, plan.
- `users`: Store admins aur managers ke login credentials.
- `devices`: Handsets ka hardware IMEI, serial, model, OS, battery, online status, lock status, GPS coordinates.
- `customers`: Grahak ka naam, primary phone, alternate phone, loan ID, EMI amount.
- `audit_logs`: Kisne kab lock kiya, unlock kiya, ya SMS bheja.

---

## 12. CRUD OPERATIONS KA PURA MATRIX
- **Tenants**: Create via `/signup`, Read in dashboard header, Update in shop settings, Delete via superadmin.
- **Devices**: Create via 6-Tap QR / modal, Read in table & inspector, Update policy / nickname, Delete via unenroll.
- **Lock State**: Create lock via button/cron, Read via status badge, Update via unlock / webhook.
- **Customer KYC**: Create during sale, Read in table & drawer, Update phone/address via inline edit, Delete on loan completion.
- **Loans**: Create loan schedule, Read in financing ledger, Update payment status, Void on full repayment.

---

## 13. WEBSOCKET REALTIME EVENTS (SOCKET.IO)
- `join_tenant`: Dashboard tenant room me judta hai.
- `register_device`: Phone server par apni identity bhejta hai.
- `heartbeat`: Phone har thodi der me battery %, charging status, aur location bhejta hai.
- `server_command`: Dashboard se phone par `LOCK`, `UNLOCK`, `SIREN`, `GET_LOCATION` bheja jaata hai.
- `device_status_changed`: Phone batata hai ki wo `LOCKED` ho gaya ya `NORMAL`.

---

## 14. EXHAUSTIVE REST API ENDPOINTS
1. `POST /api/auth/signup` — Nayi dukan register karein.
2. `POST /api/auth/login` — Dukan login karein.
3. `GET /api/auth/me` — Active session verify karein.
4. `POST /api/auth/logout` — Logout karein.
5. `GET /api/devices` — Dukan ke saare phone fetch karein.
6. `POST /api/devices/register` — Naya phone register karein.
7. `GET /api/devices/:deviceId/apps` — Phone ke apps fetch karein.
8. `POST /api/devices/:deviceId/customer` — Customer KYC update karein.
9. `POST /api/devices/:deviceId/command` — HTTP fallback command bhejien (`LOCK`, `UNLOCK`).
10. `DELETE /api/devices/:deviceId` — Phone ko dukan se unenroll karke delete karein.
11. `GET /api/app-version` — Latest DPC client version check karein.
12. `GET /download/app-release.apk` — Latest APK download karein.
13. `GET /api/provisioning-payload` — 6-tap QR ka JSON payload lein.
14. `POST /api/webhook/payment-received` — Payment gateway auto-unlock webhook.
15. `GET /api/db-status` — PostgreSQL database health check karein.

---

*Yeh raha aapka complete Hinglish master specification! Isme aapke system ka ek bhi feature ya detail baaki nahi hai.*
