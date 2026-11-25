# PRITHON MDM ENTERPRISE — MASTER FRONTEND DESIGN SYSTEM, ARCHITECTURE SPECIFICATION & FEATURE BIBLE

> **DOCUMENT REVISION**: 5.0.0 Enterprise Scalefusion-Standard (Comprehensive Feature Bible)  
> **CLASSIFICATION**: Confidential / Enterprise Financial Device Management Platform  
> **SCOPE**: Complete Frontend Architecture, Every Single Page, Screen, Modal, Drawer, Tab, Table Column, UI Control, CRUD Operation, State Machine, Telemetry Metric, WebSocket Event, REST API Contract, and Android DPC Client Hook.

---

## TABLE OF CONTENTS
1. [Executive Platform Architecture & Design Philosophy](#1-executive-platform-architecture--design-philosophy)
2. [Global Design System, Tokens & Styling Architecture](#2-global-design-system-tokens--styling-architecture)
3. [Global Shell & Viewport Layout (Scalefusion Standard)](#3-global-shell--viewport-layout-scalefusion-standard)
4. [Page 1: Enterprise Public Storefront & Marketing Portal (`index.html`)](#4-page-1-enterprise-public-storefront--marketing-portal-indexhtml)
5. [Page 2: Merchant Authentication & Gateway Portal (`login.html`)](#5-page-2-merchant-authentication--gateway-portal-loginhtml)
6. [Page 3: Retailer Onboarding & KYC Registration (`signup.html`)](#6-page-3-retailer-onboarding--kyc-registration-signuphtml)
7. [Page 4: Enterprise Fleet Management Cockpit (`dashboard.html`)](#7-page-4-enterprise-fleet-management-cockpit-dashboardhtml)
   - [7.1 Global Sticky Top Header (64px)](#71-global-sticky-top-header-64px)
   - [7.2 Scalefusion Fixed Left Navigation Sidebar (260px)](#72-scalefusion-fixed-left-navigation-sidebar-260px)
   - [7.3 Scalefusion Executive Metric KPI Strip (4 Top Cards)](#73-scalefusion-executive-metric-kpi-strip-4-top-cards)
   - [7.4 Fleet Controls Toolbar, Search Bar & Filter Pills](#74-fleet-controls-toolbar-search-bar--filter-pills)
   - [7.5 Master Fleet Data Table (View Mode A)](#75-master-fleet-data-table-view-mode-a)
   - [7.6 Visual Grid Cards View (View Mode B)](#76-visual-grid-cards-view-view-mode-b)
   - [7.7 Slide-Out Deep Device Inspector Drawer (540px Slide-Sheet)](#77-slide-out-deep-device-inspector-drawer-540px-slide-sheet)
     - [Tab 1: Overview & Hardware Telemetry](#tab-1-overview--hardware-telemetry)
     - [Tab 2: Customer & Borrower KYC Dossier](#tab-2-customer--borrower-kyc-dossier)
     - [Tab 3: Live GPS Radar & Geospatial Coordinates](#tab-3-live-gps-radar--geospatial-coordinates)
     - [Tab 4: Installed Application Catalog & Inventory](#tab-4-installed-application-catalog--inventory)
     - [Tab 5: Security, Emergency & Remote Enforcement](#tab-5-security-emergency--remote-enforcement)
   - [7.8 Dedicated Workspace Panels (Sidebar Modules)](#78-dedicated-workspace-panels-sidebar-modules)
     - [Panel 1: Live GPS Radar & Geospatial Fleet Map](#panel-1-live-gps-radar--geospatial-fleet-map)
     - [Panel 2: EMI Repayments, Financing Ledger & Dunning Engine](#panel-2-emi-repayments-financing-ledger--dunning-engine)
     - [Panel 3: 6-Tap Android Enterprise QR Provisioning Station](#panel-3-6-tap-android-enterprise-qr-provisioning-station)
     - [Panel 4: Kiosk Security & Custom Lockscreen Policy Designer](#panel-4-kiosk-security--custom-lockscreen-policy-designer)
     - [Panel 5: 0-KB Silent Cellular SMS Command Hub](#panel-5-0-kb-silent-cellular-sms-command-hub)
     - [Panel 6: Webhooks, REST API & System Health Telemetry](#panel-6-webhooks-rest-api--system-health-telemetry)
   - [7.9 Modal Dialogs & Specialized Popups](#79-modal-dialogs--specialized-popups)
     - [Modal 1: Device Enrollment & KYC Binding Modal](#modal-1-device-enrollment--kyc-binding-modal)
     - [Modal 2: Installed Applications Management Modal](#modal-2-installed-applications-management-modal)
     - [Modal 3: Emergency Factory Wipe & Confirmation Dialog](#modal-3-emergency-factory-wipe--confirmation-dialog)
     - [Modal 4: Device Unenroll & Release Confirmation](#modal-4-device-unenroll--release-confirmation)
8. [Page 5: Privacy Policy & Telecom Regulatory Disclosure (`privacy.html`)](#8-page-5-privacy-policy--telecom-regulatory-disclosure-privacyhtml)
9. [Page 6: Enterprise Master Terms of Service & Hypothecation Rights (`terms.html`)](#9-page-6-enterprise-master-terms-of-service--hypothecation-rights-termshtml)
10. [Android DPC Client Architecture & Hardware Enforcement Integration](#10-android-dpc-client-architecture--hardware-enforcement-integration)
11. [Exhaustive Database Schema & Data Dictionary](#11-exhaustive-database-schema--data-dictionary)
12. [Complete CRUD Operations Matrix](#12-complete-crud-operations-matrix)
13. [WebSocket Event Contract & Real-time Bi-directional Protocol](#13-websocket-event-contract--real-time-bi-directional-protocol)
14. [Exhaustive REST API Specification](#14-exhaustive-rest-api-specification)

---

## 1. EXECUTIVE PLATFORM ARCHITECTURE & DESIGN PHILOSOPHY

Prithon MDM Enterprise is an enterprise-grade mobile device management and financial asset collateral protection platform built specifically for smartphone retailers, Non-Banking Financial Companies (NBFCs), digital micro-lenders, and device distributors.

### 1.1 The Core Business Challenge
When smartphones are sold on monthly installment schemes (EMI), customers frequently default on repayments and subsequently:
1. Turn off Wi-Fi and Mobile Data to block internet-based lock signals.
2. Attempt hardware factory resets via Android Recovery (Volume Up + Power).
3. Connect the device to computers via USB debugging to run ADB package removal commands.
4. Remove the SIM card or boot into Android Safe Mode to disable third-party security apps.

### 1.2 The Prithon Zero-Tamper Solution
Prithon solves these vulnerabilities through a multi-tiered architecture:
- **Android Enterprise Device Owner Authority**: Granted at out-of-the-box setup via 6-tap QR provisioning. The DPC app (`com.prithon.dpc`) runs with root-level enterprise authority without requiring device rooting.
- **Factory Reset Protection (FRP) & Hardware Keystore**: Blocks OEM recovery wiping.
- **Direct Boot & Device-Protected Storage**: Direct-boot aware services ensure the phone locks instantly upon reboot before the user even enters their SIM PIN.
- **0-KB Silent Cellular SMS Gateway**: Executes immediate hardware locks over cellular signaling even when mobile data and Wi-Fi are completely disabled.
- **Automated Grace-Period Dunning Engine**: Reconciles payment webhooks from Razorpay, Cashfree, and UPI to automatically unlock devices upon payment receipt.

---

## 2. GLOBAL DESIGN SYSTEM, TOKENS & STYLING ARCHITECTURE

The Prithon frontend strictly adheres to the **Scalefusion Minimal Monochrome Design System**.

### 2.1 CSS Custom Properties (Design Tokens)
```css
:root {
  /* Canvas & Background Surfaces */
  --bg-app: #F8FAFC;                 /* Main viewport canvas background */
  --bg-surface: #FFFFFF;             /* Cards, panels, dropdowns, table rows */
  --bg-sidebar: #09090B;             /* High-density obsidian sidebar */
  --bg-sidebar-hover: #18181B;       /* Active / hovered navigation items */
  --bg-input: #FFFFFF;               /* Text inputs, select boxes */
  --bg-subtle: #F1F5F9;              /* Table headers, code blocks, pills */

  /* Borders & Dividers */
  --border: #E2E8F0;                 /* Standard subtle card borders */
  --border-strong: #CBD5E1;          /* Input borders, active dividers */
  --border-dark: #27272A;            /* Dark sidebar dividers */

  /* Typography Colors */
  --text-main: #0F172A;              /* Primary headers, high-emphasis text */
  --text-secondary: #475569;         /* Body copy, labels, primary table cells */
  --text-muted: #64748B;             /* Secondary metadata, hints, timestamps */
  --text-sidebar: #94A3B8;           /* Sidebar navigation link labels */
  --text-sidebar-active: #FFFFFF;    /* Active sidebar navigation label */

  /* Functional Accents & State Badges */
  --brand-accent: #0F172A;           /* Obsidian brand primary */
  --brand-blue: #2563EB;             /* Interactive links, primary buttons */
  --brand-blue-hover: #1D4ED8;       /* Primary button hover state */
  --brand-blue-subtle: #EFF6FF;      /* Blue badge background */
  
  --success: #10B981;                /* Normal state, repayments active */
  --success-bg: #ECFDF5;             /* Normal status pill background */
  --success-border: #A7F3D0;         /* Normal status pill border */

  --warning: #F59E0B;                /* Pending payment, low battery */
  --warning-bg: #FFFBEB;             /* Warning pill background */
  
  --danger: #EF4444;                 /* Kiosk locked, emergency wipe */
  --danger-bg: #FEF2F2;              /* Locked status pill background */
  --danger-border: #FECACA;          /* Locked status pill border */

  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-drawer: -4px 0 24px 0 rgba(0, 0, 0, 0.15);

  /* Geometry & Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
```

### 2.2 Typography Scale
- **Display 1 (Dashboard Totals)**: 28px / 32px, Bold 800, Tracking -0.02em.
- **Heading 1 (Page / Panel Titles)**: 20px / 26px, Bold 700.
- **Heading 2 (Card / Modal Titles)**: 16px / 22px, Semi-Bold 600.
- **Body Regular (Table Content, Forms)**: 13px / 18px, Medium 500.
- **Caption / Metadata (IMEIs, Timestamps)**: 11px / 14px, Regular 400.
- **Monospace (IMEIs, UUIDs, IPs)**: `'JetBrains Mono', 'SF Mono', Consolas, monospace`.

---

## 3. GLOBAL SHELL & VIEWPORT LAYOUT (SCALEFUSION STANDARD)

The authenticated dashboard environment uses a persistent, zero-flicker single-page application (SPA) shell:
- **Left Sidebar**: 260px fixed width, 100vh height, `z-index: 100`.
- **Top Sticky Header**: 64px height, calculates remaining width `calc(100vw - 260px)`, `z-index: 90`.
- **Main Viewport Area**: Scrollable content container with 24px inner padding, `min-height: calc(100vh - 64px)`.
- **Slide-out Deep Inspector**: 540px width drawer sliding in from the right edge, `z-index: 200`.
- **Backdrop Overlay**: Semi-transparent dark overlay (`rgba(15, 23, 42, 0.5)`) for drawers and modal dialogs.

---

## 4. PAGE 1: ENTERPRISE PUBLIC STOREFRONT & MARKETING PORTAL (`index.html`)

### 4.1 Page Purpose
The primary acquisition portal for mobile retailers, NBFCs, and device financiers.

### 4.2 Comprehensive Component Breakdown

#### 1. Header & Navigation Bar
- **Logo Container**: SVG Obsidian Geometric Shield with biometric vault keyhole icon.
- **Brand Wordmark**: "PRITHON MDM ENTERPRISE".
- **Navigation Links**:
  - `Features` (Anchor: `#features`)
  - `Architecture` (Anchor: `#architecture`)
  - `EMI Calculator` (Anchor: `#calculator`)
  - `Pricing & Plans` (Anchor: `#pricing`)
  - `Developer Docs` (External link)
- **Action Buttons**:
  - `Merchant Login`: Direct link to `/login`.
  - `Onboard Store`: Direct link to `/signup`.

#### 2. Hero Section
- **Announcement Pill**: "⚡ ZERO-TAMPER HARDWARE LOCK FOR SMARTPHONE FINANCING".
- **Primary Headline**: "Recover 100% of Smartphone EMIs with Hardware-Grade DPC Enforcement."
- **Value Sub-headline**: "Full Device Owner authority across Android 9 to 16. Instant remote lockdown, 0-KB offline SMS triggers, automated grace-period dunning, and Knox-level security."
- **Interactive Call-to-Action Group**:
  - Button 1: "Deploy 14-Day Free Fleet Trial" -> Directs to `/signup`.
  - Button 2: "Launch Interactive Simulator" -> Opens interactive modal demonstrating instant device lock.
- **Real-Time Fleet Stats Ticker (4 Metrics)**:
  - `12,450+` Active Handsets Managed.
  - `₹18.4 Cr+` EMI Capital Protected.
  - `99.8%` Recovery Rate Before Default.
  - `< 400ms` Command Dispatch Latency.

#### 3. Core Capabilities Grid (6 Interactive Feature Cards)
1. **Unbypassable Kiosk Lockscreen**: Complete suppression of notification bar, volume rocker, power menu, safe mode, and USB debugging.
2. **0-KB Silent Cellular SMS Gateway**: Direct encrypted SMS execution when internet connectivity is intentionally severed.
3. **Automated EMI Dunning & Webhook Sync**: Native integrations with Razorpay, Cashfree, and UPI.
4. **Interactive 6-Tap QR Provisioning**: Complete device setup in 45 seconds without computer or ADB connection.
5. **Real-time GPS Radar & Anti-Theft Geofence**: Continuous location beaconing and unauthorized boundary alerts.
6. **In-Place Silent App Updates**: Continuous silent client updates via Android `PackageInstaller` API without factory resets.

#### 4. Interactive EMI Financing Calculator
- **Interactive Range Sliders**:
  - Loan Principal (₹5,000 to ₹1,50,000, step ₹1,000).
  - Down Payment % (0% to 50%, step 5%).
  - Tenure Selector (3, 6, 9, 12, 18, 24 months).
  - Annual Interest Rate (0% to 36%).
- **Real-Time Computed Outputs**:
  - Monthly Installment (EMI).
  - Total Interest Payable.
  - Total Repayment Amount.
  - Projected Default Loss Reduction (Shows capital saved using Prithon MDM).

#### 5. Competitive Comparison Matrix
Comparison table with columns: Feature, Prithon MDM Enterprise, Scalefusion, Samsung Knox Guard, Consumer App Lockers.
- Hardware-grade Device Owner Authority.
- Anti-Power-Off Accessibility Enforcement.
- 0-KB Silent Cellular SMS Command Execution.
- Dynamic Merchant UPI QR on Lockscreen.
- Cost per device per year.

#### 6. Footer Section
- Company information, legal links (`/terms`, `/privacy`), RBI Fair Practices Code compliance, system status indicator, copyright.

---

## 5. PAGE 2: MERCHANT AUTHENTICATION & GATEWAY PORTAL (`login.html`)

### 5.1 Page Purpose
Secure authentication gateway for retail store managers, credit risk officers, and administrators.

### 5.2 Detailed UI & Functional Specification

#### 1. Header & Identity
- Centered Obsidian Shield vector logo.
- Page title: "Sign in to Prithon MDM Enterprise".
- Subtitle: "Enter your registered store credentials to manage your device fleet."

#### 2. Form Fields & Validation Logic
- **Shop Code / Tenant ID**:
  - Element ID: `input-tenant-id`
  - Validation: 3–12 uppercase alphanumeric characters (e.g. `ALH-9565`).
  - Auto-formatting: Converts lowercase input to uppercase automatically.
- **Username / Email Address**:
  - Element ID: `input-username`
  - Validation: Valid email format or alphanumeric username. Required.
- **Master Password**:
  - Element ID: `input-password`
  - Validation: Minimum 6 characters. Required.
  - Interactive show/hide toggle button with eye icon.
- **Remember Session Checkbox**:
  - Element ID: `checkbox-remember`
  - Persists JWT token in `localStorage.setItem('prithon_token', token)`.

#### 3. Quick Demo Fill Shortcut
- **Button: "Quick Fill Demo Account"**:
  - Automatically populates: `Tenant ID: ALH-9565`, `Username: alhajkhan`, `Password: admin123`.
  - Enables instant 1-click evaluation without manual typing.

#### 4. Submission & State Handling
- **Button: "Authenticate & Enter Cockpit"**:
  - Sends `POST /api/auth/login` with `{ tenantId, username, password }`.
  - Loading State: Button shows rotating spinner and text "Authenticating Store Access...".
  - Success: Stores token and redirects to `/dashboard`.
  - Error: Displays inline dismissible red alert banner with error message from server.

---

## 6. PAGE 3: RETAILER ONBOARDING & KYC REGISTRATION (`signup.html`)

### 6.1 Page Purpose
Self-serve onboarding wizard for new electronics retailers, mobile showrooms, and NBFC branches.

### 6.2 3-Step Multi-Stage Onboarding Wizard

#### Step 1: Store & Entity Information
- **Store / Business Legal Name**: e.g., "Alhaj Telecom & Electronics".
- **Unique Shop Code (Tenant ID)**: Auto-generated suggestion (e.g., `ALH-9565`), user customizable.
- **GSTIN / Shop Act Number**: Optional tax registration validation.
- **Store Address & City**: Physical store location details.

#### Step 2: Proprietor / Administrator Identity
- **Owner Full Legal Name**: Name of store proprietor.
- **Primary Mobile Number**: With 6-digit OTP verification button.
- **Official Email Address**: For fleet alerts and payment notifications.
- **Master Password**: Password strength meter (Minimum 8 chars, 1 number, 1 uppercase, 1 symbol).
- **Confirm Password**: Real-time matching validation indicator.

#### Step 3: Fleet Scale & License Tier
- **Expected Fleet Size**:
  - Tier 1: `Starter (Up to 25 Devices)` — Free pilot testing.
  - Tier 2: `Retail Pro (Up to 250 Devices)` — Standard store tier.
  - Tier 3: `Enterprise NBFC (Unlimited)` — Dedicated cloud cluster.

#### Submission & Auto-Provisioning
- Form submits to `POST /api/auth/signup`.
- Automatically provisions database tenant workspace and redirects to `/dashboard`.

---

## 7. PAGE 4: ENTERPRISE FLEET MANAGEMENT COCKPIT (`dashboard.html`)

The central operational core of the platform.

---

### 7.1 GLOBAL STICKY TOP HEADER (64px)

#### UI Elements:
1. **Breadcrumb & View Indicator**:
   - Element ID: `topbar-current-view`
   - Displays currently active workspace (e.g. `Fleet Cockpit`, `Live GPS Radar`, `6-Tap QR Station`).
2. **Global Omnibar Search Input**:
   - Element ID: `global-device-search`
   - Placeholder: `Search by IMEI, Customer Name, Phone, Loan ID, Model...`
   - Keyboard Shortcut: Focus on `⌘K` or `Ctrl+K`.
   - Functionality: Filters table and grid rows in real time with 150ms debounce (`handleGlobalSearch(query)`).
3. **Shop Identity Badge**:
   - Element ID: `display-tenant-code`
   - Text: `🏢 Shop: ALH-9565`.
4. **Real-time WebSocket Heartbeat Indicator**:
   - Element ID: `socket-dot` & `socket-status-text`
   - State 1: `🟢 Connected` (WebSocket active, 0ms latency).
   - State 2: `🟡 Reconnecting...` (Attempting socket reconnection).
   - State 3: `🔴 Offline` (Server unreachable).
5. **Quick Action Group**:
   - **Button: "+ Enroll Handset"**: Opens the device registration modal.
   - **Button: "6-Tap QR"**: Opens the instant provisioning QR modal.
   - **Button: "Sync Fleet"**: Refreshes device list from `/api/devices`.
6. **User Profile Avatar & Sign Out**:
   - Element ID: `avatar-initial` & `btn-logout`
   - Displays user initial (e.g. `A`).
   - Sign Out button clears `prithon_token` and redirects to `/login`.

---

### 7.2 SCALEFUSION FIXED LEFT NAVIGATION SIDEBAR (260px)

#### Brand Identity Container:
- Obsidian Geometric Shield vector logo.
- Platform Wordmark: **PRITHON MDM**.
- Version Pill: `v1.3.0 Enterprise`.
- Store Name Subtitle: Element ID `tenant-shop-name`.

#### Categorized Navigation Items:

```
[ FLEET GOVERNANCE ]
  ├── 🚀 Fleet Cockpit           (ID: nav-fleet, Badge: Dynamic device count)
  ├── 📡 Live GPS Radar          (ID: nav-map)
  └── ⚡ 6-Tap QR Station        (ID: nav-provisioning)

[ FINANCE & RECOVERY ]
  ├── 💳 EMI & Repayments        (ID: nav-financing)
  └── 💬 0-KB Silent SMS Hub     (ID: nav-sms)

[ SECURITY & COMPLIANCE ]
  ├── 🛡️ Kiosk & App Lock        (ID: nav-policies)
  ├── 📦 App Inventory           (Opens Apps Modal)
  └── 🔌 Webhooks & API          (ID: nav-webhooks)
```

#### Sidebar Footer:
- Server Environment Indicator: Displays whether connected to Localhost (`192.168.1.3:4000`) or Render Cloud.
- Sign Out link with confirmation prompt.

---

### 7.3 SCALEFUSION EXECUTIVE METRIC KPI STRIP (4 TOP CARDS)

```
+---------------------------+ +---------------------------+ +---------------------------+ +---------------------------+
| TOTAL MANAGED FLEET       | | REAL-TIME ONLINE          | | KIOSK LOCKED DEFAULTS     | | NORMAL / REPAYING         |
| [ 1 ]                     | | [ 1 ]                     | | [ 0 ]                     | | [ 1 ]                     |
| 1 Device Owner Armed      | | 🟢 Active WebSockets      | | 🔴 Restricted Handsets    | | 🛡️ Repaying Smoothly     |
+---------------------------+ +---------------------------+ +---------------------------+ +---------------------------+
```

1. **Card 1: Total Managed Fleet** (`metric-total` & `metric-do-count`):
   - Total number of registered devices in current tenant.
   - Sub-badge: Count of devices with Device Owner privileges active.
2. **Card 2: Real-Time Online** (`metric-online`):
   - Count of handsets currently connected via live WebSocket.
   - Styled in emerald green (`#10B981`).
3. **Card 3: Kiosk Locked Defaults** (`metric-locked`):
   - Count of handsets currently in `LOCKED` state.
   - Styled in crimson danger (`#EF4444`).
4. **Card 4: Normal / Repaying** (`metric-normal`):
   - Count of handsets in `NORMAL` unlocked state.
   - Styled in brand dark slate.

---

### 7.4 FLEET CONTROLS TOOLBAR, SEARCH BAR & FILTER PILLS

Located immediately above the device list:

#### Filter Pills:
- **All Fleet** (`pill-count-all`): Shows all registered devices.
- **🟢 Online** (`pill-count-online`): Shows devices with active socket connection.
- **🔴 Kiosk Locked** (`pill-count-locked`): Shows devices currently locked.
- **Unlocked** (`pill-count-normal`): Shows devices in normal unlocked state.
- **Offline** (`pill-count-offline`): Shows devices with inactive socket connection.

#### View Mode Toggle:
- **Button: Table View** (`btn-view-table`): Dense Scalefusion data table.
- **Button: Grid View** (`btn-view-grid`): Visual card grid.

---

### 7.5 MASTER FLEET DATA TABLE (VIEW MODE A)

The primary data grid for device fleet operations.

#### Table Columns Specification:

| Column # | Column Header | Data Field | Display & UI Representation |
|---|---|---|---|
| **Col 1** | `DEVICE / MODEL` | `device.model`, `device.manufacturer`, `device.osVersion` | Brand icon (itel/Samsung/etc.), Model name in bold, Android OS badge |
| **Col 2** | `IMEI & HARDWARE` | `device.hardwareImei`, `device.enteredImei`, `device.id` | Monospace font, 1-click copy button, dual-SIM IMEI indicator |
| **Col 3** | `CUSTOMER / KYC` | `device.customerName`, `device.customerPhone`, `device.loanId` | Customer full name, click-to-call link, Loan ID badge |
| **Col 4** | `BATTERY & VITALS` | `device.battery`, `device.isCharging` | Color-coded animated battery bar (Green > 50%, Yellow 20-50%, Red < 20%), Charging bolt icon |
| **Col 5** | `CONNECTIVITY` | `device.isOnline`, `device.ip` | Live Socket Dot (`🟢 Online` / `⚪ Offline`), IP address |
| **Col 6** | `SECURITY STATE` | `device.status`, `device.isDeviceOwner` | Status Pill: `🔒 LOCKED` (Red) or `🔓 NORMAL` (Green), Device Owner shield tag |
| **Col 7** | `QUICK ACTIONS` | Action Buttons | 🔒 Lock, 🔓 Unlock, 👁️ Inspect Drawer |

#### Action Button Handlers:
- **🔒 Lock Button**: Calls `issueCommand(deviceId, 'LOCK')`. Dispatches socket command and fallback HTTP POST. Phone locks in < 400ms.
- **🔓 Unlock Button**: Calls `issueCommand(deviceId, 'UNLOCK')`. Dispatches unlock broadcast. Phone unlocks immediately.
- **👁️ Inspect Button**: Calls `openDeviceInspector(deviceId)`. Opens the 540px slide-out drawer with full telemetry.

---

### 7.6 VISUAL GRID CARDS VIEW (VIEW MODE B)

Alternative view mode designed for visual monitoring:
- Rendered as responsive 3-column card grid (`#fleet-grid-wrapper`).
- Each card contains:
  - Header: Model name, brand icon, online/offline status dot.
  - Vitals: Monospace IMEI, Customer Name, Battery bar with percentage.
  - Large Status Badge: `🔒 KIOSK LOCKED` or `🔓 FLEET ACTIVE`.
  - Action Footer: Quick Lock, Quick Unlock, and Inspect buttons.

---

### 7.7 SLIDE-OUT DEEP DEVICE INSPECTOR DRAWER (540px SLIDE-SHEET)

Slides in from the right when `Inspect` is clicked.

#### Drawer Header:
- Device Model Title (`sheet-device-name`).
- Hardware Device ID (`sheet-device-id`).
- Quick Command Buttons: Lock (`sheet-btn-lock`) and Unlock (`sheet-btn-unlock`).
- Close Button (`✕`) and Backdrop dismiss handler (`closeDeviceInspector()`).

#### Drawer Navigation Tabs:
1. `Overview & Hardware`
2. `Customer & KYC`
3. `GPS & Location`
4. `Installed Apps`
5. `Security & Emergency`

---

#### Tab 1: Overview & Hardware Telemetry
- **Hardware IMEI**: Monospace display (`sheet-imei`) with copy icon.
- **Operating System**: Android version and API level (`sheet-os`).
- **Battery & Power**: Percentage, charging state, battery health (`sheet-battery`).
- **Device Owner Status**: Shield badge showing `Active & Enforced` (`sheet-do-state`).
- **Last Seen Timestamp**: Relative time since last heartbeat (`sheet-last-seen`).
- **Security Lock Status**: Current state (`LOCKED` or `NORMAL`) (`sheet-status`).

---

#### Tab 2: Customer & Borrower KYC Dossier
- **Borrower Full Name**: Customer name (`sheet-customer-name`).
- **Primary Mobile**: Phone number with WhatsApp and Call shortcuts (`sheet-customer-phone`).
- **Loan Account ID**: Financing contract identifier (`sheet-loan-id`).
- **Monthly Installment**: Monthly EMI amount (`sheet-emi-amount`).
- **KYC Status**: Verified badge.

---

#### Tab 3: Live GPS Radar & Geospatial Coordinates
- **Coordinates**: Latitude and Longitude (`sheet-lat-lng`) in decimal format.
- **Location Accuracy**: Precision radius in meters (`sheet-accuracy`).
- **1-Click Google Maps Button**: Element ID `sheet-maps-link`. Opens exact location in Google Maps in a new tab.
- **"Request Fresh GPS Fix" Button**: Calls `requestDeviceLocation(deviceId)` to force immediate GPS refresh from the handset.

---

#### Tab 4: Installed Application Catalog & Inventory
- Container: Element ID `sheet-apps-container`.
- Displays real-time list of all user applications installed on the device.
- Each row contains:
  - App Name and Package Name (e.g. `com.whatsapp`).
  - Version Code and App Icon.
  - Action: "Disable App" or "Uninstall App" (via Device Owner PackageManager).

---

#### Tab 5: Security, Emergency & Remote Enforcement
- **🚨 Trigger Remote Siren**: Handset plays high-decibel alarm even if on silent mode.
- **📸 Remote Front-Camera Capture**: Requests silent security selfie to identify unauthorized possessor.
- **🔄 Remote Device Reboot**: Silently reboots the Android handset.
- **⚠️ Emergency Factory Wipe**: Complete cryptographic wipe with FRP lock (Requires master password confirmation).
- **🗑️ Permanent Unenroll & Release Device**: Calls `triggerSheetRelease()`. Strips all MDM permissions, releases Device Owner, and removes device from tenant database.

---

### 7.8 DEDICATED WORKSPACE PANELS (SIDEBAR MODULES)

Switched using `switchWorkspacePanel(panelId, navEl)`:

#### Panel 1: Live GPS Radar & Geospatial Fleet Map (`panel-map`)
- Full-screen geospatial fleet visualization.
- Interactive map canvas displaying all online handsets as status-colored pins.
- Geofence Boundary Tool: Draw circular or polygon geofences to trigger automated alerts on breach.
- Fleet device list sidebar with real-time speed and address information.

#### Panel 2: EMI Repayments, Financing Ledger & Dunning Engine (`panel-financing`)
- **Portfolio Summary**: Total Financed Capital, Collected This Month, Overdue Amount, Defaulters Count.
- **Financing Ledger Table**: Customer Name, IMEI, Loan Amount, EMI Amount, Due Date, Payment Status (`PAID`, `PENDING`, `OVERDUE`, `DEFAULTED`).
- **Auto-Dunning Policy Engine**:
  - T-3 Days: Automated polite WhatsApp & SMS reminder.
  - Due Date (10:00 AM): Gentle screen warning notification.
  - Grace Period End: Persistent full-screen reminder popup every 2 hours.
  - Default (T+3): **Automatic Hardware Kiosk Lock at 12:01 AM**.
- **Manual Payment Reconciliation**: "Mark Cash Payment Received" button that instantly unlocks the phone.

#### Panel 3: 6-Tap Android Enterprise QR Provisioning Station (`panel-provisioning`)
- **Visual Provisioning Guide**:
  1. Turn on new/factory-reset phone.
  2. Tap blank space 6 times rapidly on the welcome screen.
  3. Scan the generated QR code.
  4. Device automatically installs DPC and activates Device Owner.
- **Wi-Fi Pre-Configuration Fields**:
  - Element ID: `wifi-ssid` (Store Wi-Fi Name).
  - Element ID: `wifi-pass` (Store Wi-Fi Password).
- **QR Code Canvas** (`qr-target`): Generates dynamic SVG/Canvas QR embedding the Google Enterprise JSON payload.
- **Action Buttons**: "Download QR Code" and "Print Laminated Desk Card".

#### Panel 4: Kiosk Security & Custom Lockscreen Policy Designer (`panel-policies`)
- **Visual Customizer**:
  - Custom Store Header Title.
  - Overdue Warning Notice Text.
  - Emergency Helpline Phone Number (Enabled in lockscreen emergency dialer).
  - Merchant UPI QR Code uploader (For instant customer repayment).
- **Hardware Restriction Toggles**:
  - Disable Power Off / Shut Down Menu.
  - Disable Notification Shade & Status Bar Pull-down.
  - Disable USB Debugging & ADB.
  - Disable Factory Reset via Settings.
  - Block Safe Mode Boot.
  - Disable Camera Access.
- **Live Smartphone Mockup**: Real-time interactive preview of the lock screen layout.

#### Panel 5: 0-KB Silent Cellular SMS Command Hub (`panel-sms`)
- Used when defaulting customers disable Wi-Fi and Mobile Data.
- **Controls**:
  - Customer Mobile Number (`sms-target-phone`).
  - Loan ID / Account Number (`sms-target-loan`).
  - Command Selector: `LOCK`, `UNLOCK`, `SIREN`, `GET_LOCATION`.
- **Action Button: "Dispatch 0-KB Encrypted SMS"**:
  - Sends cellular SMS command via Twilio / Fast2SMS / MSG91.
  - Target handset silently intercepts SMS and executes hardware lock.

#### Panel 6: Webhooks, REST API & System Health Telemetry (`panel-webhooks`)
- **Payment Gateway Webhook Endpoint**:
  - URL: `https://your-domain.com/api/webhook/payment-received`
  - HMAC Secret Key with Regenerate button.
  - Supported: Razorpay, Cashfree, Stripe.
  - Interactive Webhook Simulator (`sim-id`) for testing auto-unlock.
- **Database Connection Pool Status**:
  - Live PostgreSQL status check (`/api/db-status`).
  - Pool size gauge (15 session connections) and latency check.

---

### 7.9 MODAL DIALOGS & SPECIALIZED POPUPS

#### Modal 1: Device Enrollment & KYC Binding Modal
- Triggered by `+ Enroll Handset` button.
- Form fields:
  - IMEI 1 (15-digit Luhn validation).
  - IMEI 2 (Optional).
  - Hardware Serial Number.
  - Device Brand & Model Name.
  - Customer Full Legal Name.
  - Customer Primary Mobile Number.
  - Emergency Alternative Mobile.
  - Loan Reference ID.
  - Monthly EMI Amount.
  - Repayment Due Date.
- Action: "Save & Generate Provisioning QR" -> Submits to `POST /api/devices/register`.

#### Modal 2: Installed Applications Management Modal (`apps-modal`)
- Container: Element ID `apps-modal` with search filter `app-search-input`.
- Displays complete application catalog with search-as-you-type capability.
- Allows remote package disable and silent uninstallation.

#### Modal 3: Emergency Factory Wipe Confirmation Dialog
- High-danger modal with red warning border.
- Requires typing "WIPE CONFIRM" and entering master administrator password.
- Issues cryptographic remote factory wipe with persistent FRP lock.

#### Modal 4: Device Unenroll & Release Confirmation Dialog
- Displays loan clearance checklist.
- Confirms that all EMIs have been cleared before stripping Device Owner privileges.
- Calls `DELETE /api/devices/:deviceId`.

---

## 8. PAGE 5: PRIVACY POLICY & TELECOM REGULATORY DISCLOSURE (`privacy.html`)

### 8.1 Regulatory Compliance
- Satisfies Google Play Developer Policy, Android Enterprise specifications, and Reserve Bank of India (RBI) Fair Practices Code for digital lending.

### 8.2 Disclosed Hardware Permissions:
1. `BIND_DEVICE_ADMIN`: Root-level policy enforcement and FRP locking.
2. `SYSTEM_ALERT_WINDOW`: Lock screen overlay rendering (`TYPE_APPLICATION_OVERLAY`).
3. `ACCESSIBILITY_SERVICE`: Anti-power-off prevention and button suppression.
4. `ACCESS_FINE_LOCATION`: Location tracking for collateral recovery.
5. `RECEIVE_BOOT_COMPLETED`: Instant lock re-arming on reboot.
6. `RECEIVE_SMS`: 0-KB offline emergency command execution.

---

## 9. PAGE 6: ENTERPRISE MASTER TERMS OF SERVICE & HYPOTHECATION RIGHTS (`terms.html`)

### 9.1 Legal Framework
The enforceable tri-partite contract between the financing merchant, the customer/borrower, and the software platform.

### 9.2 Key Legal Clauses:
1. **Asset Hypothecation**: The smartphone remains the hypothecated property of the financing merchant until the final EMI clearance certificate is issued.
2. **Consent to Remote Lockdown**: Explicit borrower consent allowing remote kiosk lockdown upon default exceeding the grace period.
3. **Anti-Tampering Penalties**: Flashing custom firmware, modifying IMEIs, or attempting to remove Device Owner constitutes equipment tampering under relevant cyber laws.
4. **Emergency Services Guarantee**: Lockouts never disable emergency calling (112, 100, 108).

---

## 10. ANDROID DPC CLIENT ARCHITECTURE & HARDWARE ENFORCEMENT INTEGRATION

The Android client (`com.prithon.dpc`) runs as a persistent Device Owner:

### 10.1 Key Android Components:
- **`PrithonAdminReceiver`**: Extends `DeviceAdminReceiver`. Handles device owner activation, FRP lock parameters, and system policy updates.
- **`MdmForegroundService`**: Persistent foreground service with notification channel `PRITHON_MDM_PERSISTENT`. Maintains persistent WebSocket connection to server, broadcasts telemetry heartbeats, and dispatches remote commands.
- **`DeviceLockManager`**: Manages the lockscreen overlay:
  - Uses `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`.
  - Flags: `FLAG_NOT_TOUCH_MODAL`, `FLAG_FULLSCREEN`, `FLAG_LAYOUT_IN_SCREEN`, `FLAG_SHOW_WHEN_LOCKED`.
  - Suppresses status bar pull-down and system dialogs.
- **`AppUpdateManager`**: In-place silent OTA update engine. Downloads updated APKs and silently installs them via Android `PackageInstaller` API without user prompts or loss of Device Owner privileges.
- **`SmsReceiver`**: Background SMS receiver. Parses encrypted binary/text SMS commands for offline lockdown.

---

## 11. EXHAUSTIVE DATABASE SCHEMA & DATA DICTIONARY

### 11.1 PostgreSQL Schema Definition

```sql
-- 1. Tenants (Retail Stores & NBFC Workspaces)
CREATE TABLE tenants (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'ALH-9565'
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    phone VARCHAR(32),
    email VARCHAR(255),
    plan_tier VARCHAR(32) DEFAULT 'pro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users (Store Managers & Staff)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    username VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Devices (Enrolled Handset Fleet)
CREATE TABLE devices (
    id VARCHAR(64) PRIMARY KEY, -- Android Device ID (e.g. '3f72278394c4bf0b')
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    model VARCHAR(128),
    manufacturer VARCHAR(128),
    hardware_imei VARCHAR(32),
    entered_imei VARCHAR(32),
    serial_number VARCHAR(128),
    os_version VARCHAR(32),
    sdk_level INT,
    app_version VARCHAR(32),
    status VARCHAR(32) DEFAULT 'NORMAL', -- 'NORMAL' or 'LOCKED'
    is_device_owner BOOLEAN DEFAULT FALSE,
    battery INT DEFAULT 0,
    is_charging BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(64),
    wifi_ssid VARCHAR(128),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    accuracy REAL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Customers & Loans (Borrower Dossier)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    device_id VARCHAR(64) REFERENCES devices(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    alt_phone VARCHAR(32),
    loan_id VARCHAR(64),
    emi_amount NUMERIC(10, 2),
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Audit & Command Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    device_id VARCHAR(64),
    action VARCHAR(64) NOT NULL, -- 'LOCK', 'UNLOCK', 'WIPE', 'UNENROLL'
    dispatched_by VARCHAR(128),
    source VARCHAR(32), -- 'DASHBOARD', 'SMS', 'WEBHOOK'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 12. COMPLETE CRUD OPERATIONS MATRIX

| Module | Entity | Create (C) | Read (R) | Update (U) | Delete (D) |
|---|---|---|---|---|---|
| **Store Account** | Tenant | `/signup` registration form | Shop Badge & Store Profile | Edit store name, support phone, logo | Deactivate account via SuperAdmin |
| **Fleet Device** | Enrolled Handset | Enrollment Modal or 6-Tap QR | Master Table & Inspector Sheet | Update nickname, policy profile, SIM | Unenroll & Delete (`DELETE /api/devices/:id`) |
| **Security State** | Lock / Unlock | Dispatched via `LOCK` button / Cron | Table status badge (`LOCKED`/`NORMAL`) | Status transition via `UNLOCK` / Webhook | N/A (State Machine) |
| **Customer KYC** | Borrower Dossier | Bound during device enrollment | Table KYC column & Inspector Tab 2 | Inline KYC update form | Detach customer on unenrollment |
| **Financing** | Loan Contract | Registered during device sale | Financing Ledger Table | Mark payment received, edit due date | Void loan on early settlement |
| **Kiosk Policy** | Lockscreen Profile | Customizer with UPI QR upload | Live Smartphone Mockup | Edit warning text, helpline phone | Reset policy to default template |
| **Client Software**| DPC Binary | Upload new APK binary | `/api/app-version` check | In-Place Silent OTA update | N/A |
| **Cellular SMS** | 0-KB SMS | Dispatch via 0-KB SMS Hub | Delivery receipt log | N/A | Clear SMS audit log |

---

## 13. WEBSOCKET EVENT CONTRACT & REAL-TIME BI-DIRECTIONAL PROTOCOL

### 13.1 Client-to-Server Events (Dashboard & Mobile DPC)
- `join_tenant`: `{ token }` — Dashboard joins tenant room.
- `register_device`: `{ deviceId, model, osVersion, isDeviceOwner, hardwareImei }` — DPC registers with server.
- `register_customer`: `{ deviceId, customerName, customerPhone, loanId, emiAmount }` — KYC binding.
- `device_status_changed`: `{ deviceId, status }` — DPC reports transition to `LOCKED` or `NORMAL`.
- `apps_inventory`: `{ deviceId, apps: [...] }` — DPC sends installed package catalog.
- `heartbeat`: `{ deviceId, battery, status, customerName, customerPhone, loanId, emiAmount, latitude, longitude, accuracy }` — Periodic vitals.
- `device_location_updated`: `{ deviceId, latitude, longitude, accuracy, address }` — High-accuracy GPS fix.
- `request_device_location`: `{ deviceId }` — Dashboard requests immediate GPS fix.

### 13.2 Server-to-Client Events
- `device_list_updated`: Broadcasts updated device array to tenant room.
- `server_command`: `{ command: 'LOCK' | 'UNLOCK' | 'GET_LOCATION' | 'GET_APPS' | 'RELEASE_AND_UNINSTALL' | 'SIREN' | 'WIPE' }` — Dispatched to target device socket.

---

## 14. EXHAUSTIVE REST API SPECIFICATION

1. `POST /api/auth/signup`: Create new store tenant and admin account.
2. `POST /api/auth/login`: Authenticate store credentials and receive JWT.
3. `GET /api/auth/me`: Validate active session token.
4. `POST /api/auth/logout`: Invalidate session.
5. `GET /api/devices`: Retrieve all enrolled devices for current tenant.
6. `POST /api/devices/register`: Manually register or pre-provision a device.
7. `GET /api/devices/:deviceId/apps`: Fetch installed application catalog for specific device.
8. `POST /api/devices/:deviceId/customer`: Update customer KYC and contact information.
9. `POST /api/devices/:deviceId/command`: Dispatch HTTP fallback command (`LOCK`, `UNLOCK`, `SIREN`, `WIPE`).
10. `DELETE /api/devices/:deviceId`: Unenroll device, revoke Device Owner permissions, and delete record.
11. `GET /api/app-version`: Returns current APK version code and release notes for OTA updates.
12. `GET /download/app-release.apk`: Binary endpoint serving compiled DPC APK.
13. `GET /api/provisioning-payload`: Generates dynamic 6-tap QR provisioning JSON payload.
14. `POST /api/webhook/payment-received`: Webhook endpoint for Razorpay/Cashfree automated unlock.
15. `GET /api/db-status`: Checks PostgreSQL health and connection pool limits.

---

*End of Complete Master Frontend Design System, Architecture Specification & Feature Bible.*
