# PRITHON MDM ENTERPRISE — COMPLETE FRONTEND DESIGN SYSTEM & PAGE-BY-PAGE SPECIFICATION

> **DOCUMENT REVISION**: 4.0.0 Enterprise Scalefusion-Standard  
> **TARGET**: Full Frontend Architecture, Every Single Page, Modal, Drawer, Table Column, CRUD Operation, State Machine, Telemetry Field, and API/Socket Contract.

---

## TABLE OF CONTENTS
1. [Master Architecture & Design Philosophy](#1-master-architecture--design-philosophy)
2. [Global Layout & Shell Structure](#2-global-layout--shell-structure)
3. [Page 1: Landing & Enterprise Product Showcase (`index.html`)](#3-page-1-landing--enterprise-product-showcase-indexhtml)
4. [Page 2: Merchant Authentication & Gateway (`login.html`)](#4-page-2-merchant-authentication--gateway-loginhtml)
5. [Page 3: Retailer Onboarding & KYC Registration (`signup.html`)](#5-page-3-retailer-onboarding--kyc-registration-signuphtml)
6. [Page 4: Enterprise Fleet Management Cockpit (`dashboard.html`)](#6-page-4-enterprise-fleet-management-cockpit-dashboardhtml)
   - [4.1 Global Sticky Header & Quick Access Bar](#41-global-sticky-header--quick-access-bar)
   - [4.2 Enterprise Left Sidebar (260px Fixed Navigation)](#42-enterprise-left-sidebar-260px-fixed-navigation)
   - [4.3 Scalefusion Metric KPI Strip (Executive Metrics)](#43-scalefusion-metric-kpi-strip-executive-metrics)
   - [4.4 Fleet Control Toolbar, Search & Filter Bar](#44-fleet-control-toolbar-search--filter-bar)
   - [4.5 View A: Scalefusion Master Fleet Table](#45-view-a-scalefusion-master-fleet-table)
   - [4.6 View B: Fleet Visual Grid View](#46-view-b-fleet-visual-grid-view)
   - [4.7 Slide-out Drawer: Deep Device Inspector (540px)](#47-slide-out-drawer-deep-device-inspector-540px)
   - [4.8 Modal: Device Enrollment & KYC Binding](#48-modal-device-enrollment--kyc-binding)
   - [4.9 Modal: 6-Tap QR Provisioning Station](#49-modal-6-tap-qr-provisioning-station)
   - [4.10 View: Live GPS Radar & Geospatial Fleet Map](#410-view-live-gps-radar--geospatial-fleet-map)
   - [4.11 View: EMI Repayment & Auto-Dunning Engine](#411-view-emi-repayment--auto-dunning-engine)
   - [4.12 View: 0-KB Silent SMS & Offline GSM Gateway](#412-view-0-kb-silent-sms--offline-gsm-gateway)
   - [4.13 View: Kiosk Security & Custom Lockscreen Policy Designer](#413-view-kiosk-security--custom-lockscreen-policy-designer)
   - [4.14 View: Enterprise App Catalog & Inventory](#414-view-enterprise-app-catalog--inventory)
   - [4.15 View: Webhooks, REST API & System Health](#415-view-webhooks-rest-api--system-health)
7. [Page 5: Privacy Policy & Telecom Regulatory Disclosure (`privacy.html`)](#7-page-5-privacy-policy--telecom-regulatory-disclosure-privacyhtml)
8. [Page 6: Enterprise Master Terms of Service & Financing Rights (`terms.html`)](#8-page-6-enterprise-master-terms-of-service--financing-rights-termshtml)
9. [Complete Table Column & Data Dictionary](#9-complete-table-column--data-dictionary)
10. [Exhaustive CRUD Operations Matrix](#10-exhaustive-crud-operations-matrix)
11. [State Management, Socket.io Real-time Events & API Endpoints](#11-state-management-socketio-real-time-events--api-endpoints)

---

## 1. MASTER ARCHITECTURE & DESIGN PHILOSOPHY

### 1.1 Aesthetic & Visual Principles
- **Theme**: Ultra-clean, high-density modern Enterprise MDM (inspired by Scalefusion, Jamf Pro, and Google Workspace Admin Console).
- **Primary Color Palette**:
  - **Monochrome & Neutral Base**: Crisp Obsidian (`#0F172A`), Slate Black (`#09090B`), Charcoal (`#1E293B`), Border Slate (`#E2E8F0`), Background Canvas (`#F8FAFC`), Pure White (`#FFFFFF`).
  - **Functional Accents**:
    - **Success / Normal / Repaying**: Emerald Green (`#10B981` / `#ECFDF5`).
    - **Warning / Overdue / Battery Alert**: Amber Yellow (`#F59E0B` / `#FFFBEB`).
    - **Critical / Locked / Tamper / Wipe**: Crimson Red (`#EF4444` / `#FEF2F2`).
    - **Primary Brand / Enterprise Focus**: Indigo Sapphire (`#4F46E5` / `#EEF2FF`).
- **Typography**: Inter / Plus Jakarta Sans / Roboto (System UI Fallback), with JetBrains Mono / SF Mono for Hardware IMEIs, MAC addresses, and JSON payloads.
- **Micro-Interactions**: Smooth 150ms transitions, subtle card elevation on hover, pulse animations on live WebSockets, tactile button active states.

---

## 2. GLOBAL LAYOUT & SHELL STRUCTURE

All authenticated screens adhere to a standardized 3-zone shell:
```
+-----------------------------------------------------------------------------------------------+
| TOP STICKY BAR (64px) - Shop Badge | Global Search | Quick Actions | Socket Pulse | Profile    |
+-------------------+---------------------------------------------------------------------------+
| SIDEBAR (260px)   | MAIN VIEWPORT CONTAINER (Scrollable)                                      |
|                   |                                                                           |
| - Shop Brand      | [ Breadcrumb Navigation & View Title ]                                    |
| - Navigation Menu | [ Executive 4-Card KPI Metric Strip ]                                     |
|   * Cockpit       | [ Action Toolbar: Search, Filter Pills, View Switcher, Bulk Triggers ]    |
|   * GPS Radar     |                                                                           |
|   * EMI Engine    | [ Scalefusion Master Table / Visual Grid Cards ]                          |
|   * 6-Tap QR      |                                                                           |
|   * Kiosk Policy  |                                                                           |
|   * 0-KB SMS      |                                                                           |
|   * Apps & API    |                                                                           |
|                   |                                                                           |
| [ System Status ] |                                                                           |
+-------------------+---------------------------------------------------------------------------+
| DRAWER (540px slide-in from right when "Inspect" is clicked on any device)                    |
+-----------------------------------------------------------------------------------------------+
```

---

## 3. PAGE 1: LANDING & ENTERPRISE PRODUCT SHOWCASE (`index.html`)

### 3.1 Purpose
The public storefront explaining Prithon MDM Enterprise to finance retailers, NBFCs, device distributors, and smartphone shop owners.

### 3.2 Page Sections & UI Components

#### Section 1: Navigation Header (Navbar)
- **Brand Logo**: SVG Vector Obsidian Shield with biometric vault keyhole icon.
- **Brand Name**: "PRITHON MDM ENTERPRISE".
- **Navigation Links**:
  - `Features`: Smooth scroll to `#features`.
  - `Architecture`: Smooth scroll to `#architecture`.
  - `EMI Calculator`: Smooth scroll to `#calculator`.
  - `Pricing`: Smooth scroll to `#pricing`.
  - `Documentation / API`: Link to documentation.
- **CTA Buttons**:
  - `Merchant Login`: Secondary outlined button (`/login`).
  - `Onboard Store / Free Trial`: Primary solid button (`/signup`).

#### Section 2: Hero Banner
- **Eyebrow Pill**: "⚡ ZERO-TAMPER HARDWARE LOCK FOR SMARTPHONE FINANCING".
- **Headline**: "Recover 100% of Smartphone EMIs with Hardware-Grade DPC Enforcement."
- **Sub-headline**: "Cloud-controlled Device Owner management for Android 9 to 16. Instant remote lockdown, 0-KB offline SMS triggers, automated grace-period dunning, and Knox-level security."
- **Interactive Call-to-Action Group**:
  - Button 1: "Deploy 14-Day Free Fleet Trial" -> Directs to `/signup`.
  - Button 2: "Launch Interactive Simulator" -> Opens interactive modal demonstrating instant device lock.
- **Live Fleet Stats Ticker**:
  - 12,450+ Active Handsets Managed.
  - ₹18.4 Crore EMI Capital Protected.
  - 99.8% Recovery Rate Before Default.
  - < 400ms Real-Time Lock Dispatch Latency.

#### Section 3: Value Proposition & Feature Matrix (6-Card Grid)
1. **Unbypassable Kiosk Lockscreen**:
   - Disables Safe Mode, USB Debugging, Factory Reset, and Notification Bar.
   - Blocks OEM Hard-Reset combinations via Device Owner FRP (Factory Reset Protection).
2. **0-KB Silent Cellular SMS Gateway**:
   - If a customer turns off Wi-Fi and Mobile Data, dispatch encrypted GSM SMS commands to lock the phone without internet.
3. **Automated EMI Dunning & Webhook Sync**:
   - Integrates with Razorpay, Cashfree, and UPI.
   - Automatically unlocks phone the exact second repayment is received.
4. **Interactive 6-Tap QR Provisioning**:
   - Factory fresh phone setup in 45 seconds using Google Android Enterprise QR codes.
5. **Real-time GPS Radar & Anti-Theft Geofence**:
   - Tracks handset location, detects SIM swaps, and triggers sirens on unauthorized boundary breach.
6. **In-Place Silent App Updates**:
   - Continuous silent updates without unregistering Device Owner or requiring factory resets.

#### Section 4: Interactive EMI Financing Calculator
- **Inputs**:
  - Loan Principal (Slider: ₹5,000 to ₹1,50,000).
  - Down Payment % (Slider: 0% to 50%).
  - Tenure (Pills: 3 Months, 6 Months, 9 Months, 12 Months, 24 Months).
  - Interest Rate % (Annual APR).
- **Outputs**:
  - Monthly EMI Amount (Calculated in real-time).
  - Total Interest Payable.
  - Default Risk Factor Without MDM vs With Prithon MDM.

#### Section 5: Architecture Comparison Table
- Detailed comparison between:
  - Prithon MDM Enterprise vs Scalefusion vs Samsung Knox Guard vs Standard Consumer App Lockers.
- Criteria: Device Owner root authority, Anti-Power-Off prevention, Offline SMS capability, Cost per device, Custom UPI QR on Lockscreen.

#### Section 6: Footer
- Company links, Terms of Service (`/terms`), Privacy Policy (`/privacy`), RBI Guidelines compliance, System Status, Copyright notice.

---

## 4. PAGE 2: MERCHANT AUTHENTICATION & GATEWAY (`login.html`)

### 4.1 Purpose
Secure entry point for store managers, NBFC loan officers, and super-administrators.

### 4.2 Page Components & Functionalities

#### Header & Brand Identity
- Centered Shield Logo with subtle drop shadow.
- "Sign in to Prithon MDM Enterprise".
- Subtitle: "Enter your registered store credentials to manage your device fleet."

#### Login Form Container
- **Field 1: Shop Code / Tenant ID**:
  - Label: `Shop / Tenant Identifier`.
  - Placeholder: `e.g. ALH-9565 or STORE-MUMBAI`.
  - Validation: 3-12 alphanumeric characters. Required.
- **Field 2: Username / Email**:
  - Label: `Admin Email or Username`.
  - Placeholder: `admin@yourstore.com`.
  - Validation: Standard email format or alphanumeric.
- **Field 3: Master Password**:
  - Label: `Password`.
  - Type: Password with show/hide toggle icon.
  - Placeholder: `••••••••••••`.
- **Remember Session Checkbox**:
  - Stores JWT token in secure `localStorage` / `HttpOnly` cookie.
- **Forgot Password Link**:
  - Triggers password reset modal via registered mobile OTP.

#### Quick Demo Access Bar (One-Click Testing)
- "Quick Fill Demo Account" button:
  - Auto-populates `Tenant: ALH-9565`, `Username: alhajkhan`, `Password: admin123`.

#### Action Buttons
- **Primary Submit Button**: "Authenticate & Enter Cockpit".
  - Loading State: Shows animated spinner with text "Validating Security Clearance...".
- **Error Banner**:
  - Red alert banner displaying server response (e.g., "Invalid Shop Code or Password", "Account Suspended").
- **Footer Link**: "Don't have a registered store? Onboard your shop here" -> `/signup`.

---

## 5. PAGE 3: RETAILER ONBOARDING & KYC REGISTRATION (`signup.html`)

### 5.1 Purpose
Merchant self-serve onboarding, shop verification, and tenant workspace provisioning.

### 5.2 Form Stepper & Workflow

#### Step 1: Shop / Business Information
- **Store / Business Legal Name**: e.g., "Alhaj Telecom & Electronics".
- **Unique Shop Code (Tenant ID)**: Auto-generated suggestion (e.g., `ALH-9565`), user customizable.
- **GSTIN / Shop Act Number**: Optional tax registration validation.
- **Store Address & City**: Store location details.

#### Step 2: Store Owner & Administrator Credentials
- **Owner Full Name**: Store proprietor name.
- **Primary Mobile Number**: With 6-digit OTP verification button.
- **Official Email Address**: For fleet alerts and payment notifications.
- **Create Master Password**: Password strength meter (Minimum 8 chars, 1 number, 1 uppercase, 1 symbol).
- **Confirm Password**: Real-time matching validation indicator.

#### Step 3: Fleet Size & License Tier
- **Expected Monthly Device Registrations**:
  - Radio Card 1: `Starter (Up to 25 Devices)` — Free tier for pilot testing.
  - Radio Card 2: `Retail Pro (Up to 250 Devices)` — Ideal for independent stores.
  - Radio Card 3: `Enterprise NBFC (Unlimited Devices)` — Dedicated cloud instance & multi-store hierarchy.

#### Terms & Submission
- Checkbox: "I agree to the Prithon Master MDM Service Agreement & RBI Fair Practice Code."
- Submit Button: "Create Store Account & Generate API Keys".
- Success Transition: Auto-redirects to `/dashboard` upon successful registration.

---

## 6. PAGE 4: ENTERPRISE FLEET MANAGEMENT COCKPIT (`dashboard.html`)

This is the primary operating system of the web dashboard.

---

### 6.1 GLOBAL STICKY HEADER & QUICK ACCESS BAR (Height: 64px)

#### Elements & Micro-Components:
1. **Mobile Menu Toggle (Hamburger)**: Visible on tablet/mobile screens to slide out the sidebar.
2. **Current Breadcrumb Trail**: e.g., `Fleet Cockpit / Overview / Live Devices`.
3. **Global Omnibar Search Box**:
   - Keyboard Shortcut: `⌘K` or `Ctrl+K`.
   - Placeholder: `Quick Search by IMEI, Phone, Model, or Customer Name...`.
   - Auto-filters the master table on every keystroke (`keyup` event with 150ms debounce).
4. **Shop Badge & Tenant Chip**:
   - Displays current store ID: `🏢 Shop: ALH-9565`.
   - Tooltip: Shows connected tenant database name and license type.
5. **WebSocket Gateway Pulse Indicator**:
   - **Green Pulsing Dot (`#10B981`)**: "Socket Connected (0ms latency)".
   - **Yellow Blinking Dot**: "Reconnecting to Gateway...".
   - **Red Solid Dot**: "Offline / Gateway Unreachable".
6. **Quick Header Actions**:
   - **Button: + Enroll Handset**: Primary blue/indigo button that triggers the Enrollment Modal.
   - **Button: 6-Tap QR**: Secondary outlined button that opens the instant QR Provisioning Station.
   - **Refresh Sync Button**: Rotates 360° on click, fetches latest `/api/devices` telemetry.
7. **User Profile Dropdown**:
   - Avatar icon with store manager initials.
   - Dropdown options: Store Settings, Change Password, API Tokens, Logout (`/api/auth/logout`).

---

### 6.2 ENTERPRISE LEFT SIDEBAR (Width: 260px Fixed)

#### Brand Header:
- Obsidian Shield Vector Logo.
- Title: **PRITHON MDM**.
- Version Badge: `v1.3.0 Enterprise`.

#### Categorized Navigation Menu:

##### Category 1: FLEET GOVERNANCE
- **Item 1: Fleet Cockpit (Active View)**:
  - Icon: Grid / Layout icon.
  - Badge: Dynamic count of registered devices (e.g., `1`).
  - Action: Displays master table and metric cards.
- **Item 2: Live GPS Radar**:
  - Icon: Satellite / Map pin icon.
  - Action: Switches viewport to full-screen interactive GPS radar.
- **Item 3: 6-Tap QR Station**:
  - Icon: QR Code icon.
  - Action: Opens the instant provisioning QR canvas.

##### Category 2: FINANCE & RECOVERY
- **Item 4: EMI & Repayments**:
  - Icon: Credit Card / Indian Rupee currency icon.
  - Action: Opens EMI schedule, overdue tracker, and automated dunning logs.
- **Item 5: 0-KB Silent SMS Hub**:
  - Icon: Message square / Antenna icon.
  - Action: Opens the cellular SMS dispatch terminal for offline handsets.

##### Category 3: SECURITY & COMPLIANCE
- **Item 6: Kiosk & App Lock Policies**:
  - Icon: Lock / Shield icon.
  - Action: Opens policy designer for custom lock screens, UPI QR upload, and button lockdown.
- **Item 7: App Catalog & Inventory**:
  - Icon: Layers / Box icon.
  - Action: Lists managed APKs, in-place update server, and package blacklisting.
- **Item 8: Webhooks & Integrations**:
  - Icon: Code / Terminal icon.
  - Action: Displays webhook URLs for Razorpay/Cashfree auto-unlock and PostgreSQL connection pool stats.

#### Sidebar Footer:
- Server Endpoint Toggle: Displays whether connected to `Localhost:4000` or `Render Cloud`.
- Sign Out link with confirmation prompt.

---

### 6.3 SCALEFUSION METRIC KPI STRIP (Executive Metrics)

A responsive 4-card KPI strip displayed at the top of the main viewport:

```
+-------------------+ +-------------------+ +-------------------+ +-------------------+
| TOTAL MANAGED     | | REAL-TIME ONLINE  | | KIOSK LOCKED      | | NORMAL / ACTIVE   |
| 1                 | | 1                 | | 0                 | | 1                 |
| All registered    | | Active WebSockets | | Restricted Access | | Repaying smoothly |
| devices in tenant | | Heartbeat < 30s   | | Overdue or Siren  | | All apps allowed  |
+-------------------+ +-------------------+ +-------------------+ +-------------------+
```

#### Detailed Specifications for Each Metric Card:
1. **Total Managed Fleet Card**:
   - **Header**: "TOTAL MANAGED FLEET".
   - **Value**: Dynamic integer (e.g., `1`).
   - **Sub-label**: "Enrolled under Tenant ALH-9565".
   - **Icon**: Mobile phone silhouette in slate container.
   - **Color Tone**: Monochrome dark slate.
2. **Real-Time Online Card**:
   - **Header**: "REAL-TIME ONLINE".
   - **Value**: Dynamic integer of devices currently having an active Socket.io session.
   - **Sub-label**: "🟢 Live Socket Heartbeat".
   - **Icon**: WiFi signal icon with emerald pulse ring.
   - **Color Tone**: Emerald green theme.
3. **Kiosk Locked Defaults Card**:
   - **Header**: "KIOSK LOCKED DEFAULTS".
   - **Value**: Dynamic integer of devices currently in `LOCKED` state.
   - **Sub-label**: "Finance Overdue / Anti-Theft".
   - **Icon**: Padlock locked icon.
   - **Color Tone**: Crimson red theme.
4. **Normal / Repaying Card**:
   - **Header**: "NORMAL / REPAYING".
   - **Value**: Dynamic integer of devices in `NORMAL` unlocked state.
   - **Sub-label**: "EMI cleared / Free access".
   - **Icon**: Shield checkmark icon.
   - **Color Tone**: Blue sapphire theme.

---

### 6.4 FLEET CONTROL TOOLBAR, SEARCH & FILTER BAR

Located immediately above the device list:

#### Left Group: Filter Pills
- **Pill 1: All (`filter-all`)**: Shows every device regardless of state.
- **Pill 2: Online (`filter-online`)**: Filters devices where `socketConnected == true`.
- **Pill 3: Locked (`filter-locked`)**: Filters devices where `status == "LOCKED"`.
- **Pill 4: Normal (`filter-normal`)**: Filters devices where `status == "NORMAL"`.
- **Pill 5: Offline (`filter-offline`)**: Filters devices with inactive socket connection.

#### Center Group: Inline Search Bar
- Input field with magnifying glass icon.
- Real-time search by:
  - IMEI 1 / IMEI 2
  - Model Name (e.g. `itel C672N`, `Samsung Galaxy A14`)
  - Customer Full Name (e.g. `Alhaj Khan`)
  - Loan ID / Account Number

#### Right Group: View Mode & Action Toggles
- **View Toggle Buttons**:
  - `Table View`: Standard Scalefusion dense rows (Default).
  - `Grid Cards View`: Visual card grid with battery bars and screen preview.
- **Action Button: Bulk Actions Dropdown**:
  - Bulk Lock Selected Devices.
  - Bulk Unlock Selected Devices.
  - Bulk Send SMS Reminder.
  - Export Fleet Data as CSV / Excel.

---

### 6.5 VIEW A: SCALEFUSION MASTER FLEET TABLE

The core inventory table displaying all device information:

#### Table Columns Specification:

| # | Column Name | Header Label | Data Field / Representation | UI Elements & Interaction |
|---|-------------|--------------|-----------------------------|---------------------------|
| 1 | **Selection** | `[ ]` (Select All) | Checkbox | Checkbox to select single or all rows for batch actions |
| 2 | **Device Model & OS** | `DEVICE / MODEL` | `device.model` + `device.osVersion` | Brand logo badge (itel/Samsung/etc.), Model name in bold, OS badge (e.g. `Android 14`) |
| 3 | **Hardware Identifiers** | `IMEI & SERIAL` | `device.imei` + `device.serial` | Monospace font, 1-click copy button, dual-SIM IMEI indicator |
| 4 | **Customer / Borrower** | `CUSTOMER / KYC` | `customer.name` + `customer.phone` | Customer name, click-to-call phone link, Loan ID badge |
| 5 | **Battery & Telemetry** | `BATTERY & VITALS` | `device.batteryLevel` + `isCharging` | Animated progress bar (Color: Green > 50%, Amber 20-50%, Red < 20%), Charging lightning bolt icon |
| 6 | **Connectivity & Network** | `CONNECTIVITY` | `device.ip` + `device.wifiSsid` + `isOnline` | Live Socket Dot (`🟢 Online` / `⚪ Offline`), Local/WAN IP, Connected Wi-Fi SSID |
| 7 | **Security & Policy State** | `SECURITY STATE` | `device.status` + `device.isDeviceOwner` | State Pill: `🔒 LOCKED` (Red) or `🔓 NORMAL` (Green), Device Owner shield badge |
| 8 | **Quick Action Controls** | `ACTIONS` | Dynamic triggers | 3 Action Buttons per row: 🔒 Lock, 🔓 Unlock, 👁️ Inspect Drawer |

#### Action Buttons Behavior:
- **Button: 🔒 Lock**:
  - Sends immediate Socket command: `socket.emit('dispatch_command', { deviceId, command: 'LOCK' })`.
  - Also issues fallback REST POST: `/api/devices/:deviceId/command` with `{ command: 'LOCK' }`.
  - Button switches to loading spinner during dispatch.
  - Shows green toast notification: "Lock command dispatched to [Model]".
- **Button: 🔓 Unlock**:
  - Sends immediate Socket command: `socket.emit('dispatch_command', { deviceId, command: 'UNLOCK' })`.
  - Fallback REST POST: `/api/devices/:deviceId/command` with `{ command: 'UNLOCK' }`.
  - Immediately restores phone to normal launcher.
- **Button: 👁️ Inspect**:
  - Opens the 540px Slide-out Drawer (Deep Device Inspector) populated with the selected device's complete telemetry.

---

### 6.6 VIEW B: FLEET VISUAL GRID VIEW

Alternative view mode designed for quick visual monitoring:
- Rendered as responsive 3-column card grid.
- Each Card contains:
  - Top Bar: Model name, Brand icon, Online/Offline badge.
  - Middle Section: Device Owner status, Monospace IMEI, Customer Name, Live Battery Bar with percentage.
  - Mini Status Display: Large badge showing `🔒 KIOSK LOCKED` or `🔓 FLEET ACTIVE`.
  - Bottom Action Toolbar: Lock button, Unlock button, and View Details button.

---

### 6.7 SLIDE-OUT DRAWER: DEEP DEVICE INSPECTOR (Width: 540px)

Slides in from the right edge of the screen when `Inspect` is clicked.

#### Drawer Structure:

##### Drawer Header (Sticky Top):
- Device Title: e.g. `itel C672N (alhajkhan)`.
- Status Chip: `ONLINE` (Green) | `DEVICE OWNER ACTIVE` (Blue).
- Action Icons: Refresh Telemetry, Expand Full-Screen, Close Drawer (`✕`).

##### Navigation Tabs:
The drawer contains 5 interactive tabs:
1. `Overview & Hardware`
2. `Customer & KYC`
3. `GPS & Geofence`
4. `App Inventory`
5. `Security & Emergency`

---

#### Detailed Tab Contents:

##### Tab 1: Overview & Hardware Telemetry
- **Model Name**: e.g., `itel C672N`.
- **Manufacturer / OEM**: e.g., `itel / TRANSSION`.
- **Android Version**: e.g., `Android 14 (API 34)`.
- **DPC App Version**: e.g., `v1.3.0 (Build 4)`.
- **Device Owner Status**: `Active & Enforced` (with green verified tick).
- **IMEI 1**: Monospace with copy button (`3579...`).
- **IMEI 2**: Monospace with copy button.
- **Hardware Serial**: e.g., `3c7ca167b16fe8a`.
- **IP Address**: Local Wi-Fi IP and Public Gateway IP.
- **Battery Status**: e.g., `87% - Discharging (Good Health, 31°C)`.
- **RAM & Internal Storage**: Visual gauge showing used vs available storage.

##### Tab 2: Customer & KYC Dossier
- **Borrower Full Name**: e.g., `Alhaj Khan`.
- **Primary Mobile**: e.g., `+91 98765 43210` with WhatsApp link and Call link.
- **Alternative Mobile**: Emergency recovery contact number.
- **Aadhaar / National ID**: Masked display (`XXXX-XXXX-1234`).
- **Store Invoice Number**: e.g., `INV-2026-0891`.
- **Loan Account ID**: e.g., `LN-98213`.
- **Edit KYC Button**: Opens inline modal to update customer phone numbers or address.

##### Tab 3: GPS & Geofence
- **Coordinates**: Latitude & Longitude in decimal format (e.g. `28.6139° N, 77.2090° E`).
- **Location Accuracy**: e.g., `Accurate within 8 meters (GPS + Cell Tower)`.
- **Last Seen Timestamp**: Relative timestamp (e.g., `2 minutes ago`).
- **Interactive Mini-Map Preview**: Leaflet / OpenStreetMap container showing device pin.
- **1-Click Google Maps Link**: External link button: `Open in Google Maps`.
- **Geofence Policy**:
  - Safe Zone status: `Inside Store Authorized Radius (Delhi NCR)`.
  - Anti-Theft Boundary Breach Alert toggle.

##### Tab 4: App Inventory & Management
- List of all installed user applications retrieved via MDM PackageManager.
- Columns: App Icon, Application Name, Package Name, Version Code, Permissions Count.
- Actions per app:
  - `Disable / Hide App`: Prevents app from running.
  - `Uninstall App`: Silently removes package if managed.
  - `Block Network`: Restricts background data.

##### Tab 5: Security & Emergency Remote Actions
- **Emergency Action Buttons**:
  - 🚨 **Trigger Remote Siren**: Causes handset to play high-decibel alarm even if on silent mode.
  - 📸 **Remote Front-Camera Capture**: Requests silent security selfie to identify unauthorized possessor.
  - 🔄 **Reboot Device**: Silently reboots the Android handset.
  - ⚠️ **Remote Factory Wipe**: Complete cryptographic wipe with FRP lock (Requires master password confirmation).
  - 🗑️ **Unenroll & Delete Device**: Strips all MDM permissions, releases Device Owner, and removes device from tenant database.

---

### 6.8 MODAL: DEVICE ENROLLMENT & KYC BINDING

Triggered by the `+ Enroll Handset` button.

#### Fields & Validations:
1. **Primary IMEI 1**:
   - 15-digit Luhn algorithm validation. Required.
2. **Secondary IMEI 2**:
   - Optional 15-digit validation.
3. **Hardware Serial Number**:
   - Optional serial string.
4. **Device Model / Brand**:
   - e.g., `Samsung Galaxy M14 5G`.
5. **Customer Full Name**:
   - Required text field.
6. **Customer Mobile Number**:
   - 10-digit phone number. Required.
7. **Alternative Emergency Number**:
   - Family member or guarantor phone number.
8. **Loan Reference ID**:
   - Internal financing account code.
9. **Monthly EMI Amount**:
   - e.g., `₹1,850`.
10. **Repayment Due Date**:
    - Date picker (e.g., 5th of every month).

#### Form Actions:
- **Save & Generate Provisioning QR**: Submits to `POST /api/devices/register` and directly transitions to the 6-Tap QR Station with pre-bound tenant credentials.
- **Cancel Button**: Dismisses modal without saving.

---

### 6.9 MODAL: 6-TAP QR PROVISIONING STATION

Facilitates 45-second factory provisioning on any brand new out-of-the-box Android device.

#### Provisioning Workflow Guide (Visual Steps):
1. **Step 1**: Turn on new/factory-reset phone.
2. **Step 2**: On the first "Welcome" or "Hi there" language selection screen, tap the blank space **6 times rapidly**.
3. **Step 3**: The Android system opens the built-in QR code camera scanner.
4. **Step 4**: Scan the QR code displayed on this station.
5. **Step 5**: Handset automatically connects to Wi-Fi, silently downloads Prithon DPC, activates Device Owner without ADB, and binds to Shop `ALH-9565`.

#### QR Code Technical Payload Generator:
The station dynamically renders an SVG/Canvas QR code embedding the following Google Enterprise JSON payload:

```json
{
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.prithon.dpc/.receivers.PrithonAdminReceiver",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://prithon-mdm-backend.onrender.com/download/app-release.apk",
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "k5O1Fj...SHA256_HASH...",
  "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
  "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
    "tenant_id": "ALH-9565",
    "server_url": "https://prithon-mdm-backend.onrender.com",
    "shop_name": "Alhaj Telecom",
    "auto_lock_on_sim_removal": true
  }
}
```

#### Station Actions:
- **Button: Download QR (PNG / SVG)**: For saving to computer.
- **Button: Print Laminated Store Floor Card**: Opens print-formatted view suitable for in-store physical setup desks.
- **Wi-Fi Pre-Configuration Toggle**: Allows embedding the store's Wi-Fi SSID and password directly into the QR code so the phone connects automatically without typing Wi-Fi passwords.

---

### 6.10 VIEW: LIVE GPS RADAR & GEOSPATIAL FLEET MAP

Full-screen geospatial fleet visualization.

#### Features:
1. **Interactive Map Canvas**:
   - Leaflet / Mapbox engine with Dark Mode or Satellite map tiles.
   - Smooth panning, zooming, and clustering for thousands of devices.
2. **Device Map Markers**:
   - Custom marker icons displaying brand logo and status ring (Green = Normal, Red = Locked, Gray = Offline).
   - Marker click opens mini popup: Model, Customer Name, Battery %, Speed, and 1-Click Lock button.
3. **Geofence Boundary Tool**:
   - Draw circular or polygon geofences directly on the map.
   - Define Allowed Zone vs Restricted Zone.
   - Set automatic action on breach: "Auto-Lock Device" or "Send High-Priority SMS Alert".
4. **Historical Breadcrumb Route Playback**:
   - Select date range to play back travel history of a defaulting handset.
   - Displays speed, stopping points, and route timeline.

---

### 6.11 VIEW: EMI REPAYMENT & AUTO-DUNNING ENGINE

Dedicated module for financial tracking and automatic lock enforcement.

#### Components:
1. **EMI Portfolio Summary Cards**:
   - Total Financed Value.
   - Collected This Month.
   - Overdue Amount Pending.
   - Handsets Currently Locked for Non-Payment.
2. **Repayment Schedule Table**:
   - Columns: Loan Account ID, Customer Name, IMEI, Total Loan, EMI Amount, Due Date, Days Overdue, Repayment Status (`Paid`, `Pending`, `Grace Period`, `Defaulted`).
3. **Auto-Dunning Rules Engine (Configurable Policies)**:
   - **T-3 Days Before Due Date**: Automated polite WhatsApp & SMS payment reminder with instant UPI payment link.
   - **Due Date (10:00 AM)**: Gentle warning notification on phone screen.
   - **T+2 Days (Grace Period End)**: Persistent full-screen reminder popup every 2 hours.
   - **T+3 Days (Default)**: **Automatic Hardware Kiosk Lock triggered at 12:01 AM**. Lockscreen displays retailer UPI QR code and support helpline.
4. **Manual Payment Reconciliation**:
   - Button: "Mark Cash Payment Received" -> Instantly dispatches `UNLOCK` command to the customer's phone in real time.

---

### 6.12 VIEW: 0-KB SILENT SMS & OFFLINE GSM GATEWAY

Used when a defaulting customer intentionally disables Wi-Fi and Mobile Data to evade internet-based lock commands.

#### How It Works:
- The DPC application has a background `SmsReceiver` listening for encrypted binary or text SMS from the store's authorized gateway number.
- When an SMS is received, Android handles it silently (without playing ringtones or appearing in the default messaging app) and executes the hardware lock command immediately.

#### UI Controls in Dashboard:
1. **Target Phone Selector**: Dropdown or auto-populated from selected device.
2. **Registered SIM Number**: Displays the SIM number currently inserted in the device.
3. **SMS Command Type**:
   - Radio 1: `LOCK_DEVICE` (Payload: `#PRITHON#LOCK#<TENANT_KEY>`)
   - Radio 2: `UNLOCK_DEVICE` (Payload: `#PRITHON#UNLOCK#<TENANT_KEY>`)
   - Radio 3: `TRIGGER_SIREN` (Payload: `#PRITHON#SIREN#<TENANT_KEY>`)
   - Radio 4: `QUERY_LOCATION` (Handset silently replies with GPS coordinates via SMS)
4. **SMS Gateway Provider Selector**:
   - Twilio / Fast2SMS / MSG91 / Local GSM Hardware Dongle.
5. **Dispatch Button**: "Send 0-KB Encrypted SMS Command".
6. **Delivery Log**: Displays SMS delivery receipts, network carrier status, and execution timestamps.

---

### 6.13 VIEW: KIOSK SECURITY & CUSTOM LOCKSCREEN POLICY DESIGNER

Allows the store owner to customize the exact appearance and restrictions of the lock screen shown on defaulting customer phones.

#### Customizer Controls:
1. **Lock Screen Visual Branding**:
   - **Store Name / Header**: e.g., "Alhaj Electronics — EMI Overdue Notice".
   - **Warning Notice Text**: e.g., "This device has been temporarily restricted due to pending monthly EMI. Please clear the payment below to restore full functionality immediately."
   - **Support Phone Number**: Click-to-call button active on lock screen (Emergency dialer enabled).
   - **WhatsApp Support Link**: For instant customer chat.
   - **Dynamic UPI Payment QR Code**:
     - Upload custom merchant QR or enter Merchant UPI ID (e.g. `alhaj@okhdfcbank`).
     - Customer can scan the QR code from another phone or make repayment to unlock instantly.
2. **Hardware Restriction Toggles**:
   - `[X] Disable Power Off / Shut Down Menu`: Handset cannot be turned off while locked.
   - `[X] Disable Notification Shade & Status Bar Pull-down`: Prevents turning off Wi-Fi or entering Settings.
   - `[X] Disable USB Debugging & ADB`: Blocks computer connection.
   - `[X] Disable Factory Reset via Settings`: Blocks software reset.
   - `[X] Block Safe Mode Boot`: Prevents booting into safe mode to bypass MDM.
   - `[X] Disable Camera Access`: Restricts camera usage while in default.

#### Live Lock Screen Interactive Preview:
- An interactive smartphone mockup on the right side of the screen renders real-time changes to the lockscreen layout as options are toggled.

---

### 6.14 VIEW: ENTERPRISE APP CATALOG & INVENTORY

Manages application distribution and updates across all enrolled devices.

#### Features:
1. **Prithon DPC In-Place OTA Engine**:
   - Displays current client APK version (`v1.3.0`, `versionCode = 4`).
   - "Upload New APK" dropzone: Allows compiling and uploading updated APK binaries.
   - Silent In-Place Update trigger: Uses Android `PackageInstaller` API to update the DPC app silently in the background without user intervention or factory resets.
2. **Managed Application Store**:
   - Add Play Store or enterprise APKs to automatically install on newly enrolled handsets (e.g., store warranty app, payment app).
3. **Application Blacklisting / Whitelisting**:
   - Block malicious bypass tools, third-party APK installers, or factory-reset assistant tools.

---

### 6.15 VIEW: WEBHOOKS, REST API & SYSTEM HEALTH

Provides technical visibility and third-party integration controls.

#### Features:
1. **Payment Gateway Webhook Endpoint**:
   - Webhook URL: `https://your-domain.com/api/webhook/payment-received`
   - Secret Key: Masked HMAC signing key with Regenerate button.
   - Supported Payloads: Razorpay `payment.captured`, Cashfree `PAYMENT_SUCCESS`, Stripe `checkout.session.completed`.
   - Automatic Action: Automatically parses customer phone/loan ID and dispatches `UNLOCK` command in < 1 second.
2. **Database & Connection Pool Status**:
   - Live PostgreSQL connection status indicator (`/api/db-status`).
   - Session Pool Size gauge (e.g., 15 pool slots, latency check).
3. **REST API Tokens**:
   - Generate Bearer Tokens for external ERP / POS software integration.

---

## 7. PAGE 5: PRIVACY POLICY & TELECOM REGULATORY DISCLOSURE (`privacy.html`)

### 7.1 Purpose
Legal compliance page satisfying Google Play Developer Policy, Android Enterprise requirements, and Reserve Bank of India (RBI) Fair Practices Code for digital lending.

### 7.2 Key Legal Sections:
1. **Data Controller & Tenant Architecture**: Explains that store merchants act as Data Controllers and Prithon acts as Data Processor.
2. **Permissions Disclosure**:
   - `BIND_DEVICE_ADMIN`: Discloses hardware management and policy enforcement.
   - `SYSTEM_ALERT_WINDOW`: Explains the lock screen overlay mechanism.
   - `ACCESSIBILITY_SERVICE`: Details anti-power-off prevention and accessibility safeguards.
   - `ACCESS_FINE_LOCATION`: Explains that location is accessed solely for anti-theft and recovery of financed assets.
3. **Data Retention & Encryption**: 256-bit AES encryption at rest, TLS 1.3 in transit, and complete data deletion upon loan completion.
4. **User Rights**: Process for unenrollment and clearance certificate after all EMIs are cleared.

---

## 8. PAGE 6: ENTERPRISE MASTER TERMS OF SERVICE & FINANCING RIGHTS (`terms.html`)

### 8.1 Purpose
The enforceable master agreement between the financing retailer, customer/borrower, and software platform.

### 8.2 Key Legal Clauses:
1. **Asset Ownership & Collateral Status**: Handset remains hypothecated collateral of the financing merchant until the final EMI receipt is issued.
2. **Consent to Remote Lockdown**: Explicit consent granted by customer allowing remote restriction in the event of default exceeding grace period.
3. **Anti-Tampering & Criminal Liability**: Tampering with Device Owner permissions, flashing unauthorized ROMs, or altering hardware IMEI constitutes contractual breach and equipment tampering under relevant cyber laws.
4. **Fair Debt Collection Compliance**: Mandates that lockouts do not disable emergency dialing (e.g. 112, 100, 108) and provide clear customer support helpline access at all times.

---

## 9. COMPLETE TABLE COLUMN & DATA DICTIONARY

This table provides the exhaustive data schema for every field rendered in the frontend:

| Table / Entity | Field Name | Data Type | Nullable | Description & Frontend Display Format |
|---|---|---|---|---|
| **Devices** | `id` | String / UUID | No | Primary key identifier (e.g., `3f72278394c4bf0b`) |
| **Devices** | `tenant_id` | String | No | Store / Tenant ID (e.g., `ALH-9565`) |
| **Devices** | `model` | String | Yes | Commercial model name (e.g., `itel C672N`) |
| **Devices** | `manufacturer` | String | Yes | OEM Manufacturer (e.g., `itel`) |
| **Devices** | `imei` | String(15) | Yes | Primary hardware IMEI (Monospace font) |
| **Devices** | `imei2` | String(15) | Yes | Secondary hardware IMEI |
| **Devices** | `serial_number` | String | Yes | OEM Hardware serial string |
| **Devices** | `os_version` | String | Yes | Android OS version (e.g., `Android 14`) |
| **Devices** | `sdk_level` | Integer | Yes | Android API level (e.g., `34`) |
| **Devices** | `app_version` | String | Yes | Installed DPC client version (e.g., `1.3.0`) |
| **Devices** | `status` | Enum | No | Security status: `NORMAL` or `LOCKED` |
| **Devices** | `is_device_owner` | Boolean | No | Indicates Device Owner enforcement (`true`/`false`) |
| **Devices** | `battery_level` | Integer | Yes | Battery percentage (0 to 100) |
| **Devices** | `is_charging` | Boolean | Yes | Charging state (`true` = lightning icon) |
| **Devices** | `ip_address` | String | Yes | Local/Private IP address (e.g., `192.168.1.4`) |
| **Devices** | `wifi_ssid` | String | Yes | Connected Wi-Fi network name |
| **Devices** | `latitude` | Float | Yes | Current GPS latitude |
| **Devices** | `longitude` | Float | Yes | Current GPS longitude |
| **Devices** | `last_seen` | Timestamp | Yes | ISO timestamp of last heartbeat ping |
| **Customers** | `id` | UUID | No | Customer record identifier |
| **Customers** | `name` | String | No | Full legal name of borrower |
| **Customers** | `phone` | String | No | Primary mobile phone number |
| **Customers** | `alt_phone` | String | Yes | Emergency / Alternate phone number |
| **Customers** | `aadhaar_masked` | String | Yes | Masked national identification number |
| **Customers** | `invoice_no` | String | Yes | Store sales invoice number |
| **Loans** | `id` | UUID | No | Loan contract identifier |
| **Loans** | `loan_amount` | Decimal | No | Total financed principal amount |
| **Loans** | `emi_amount` | Decimal | No | Monthly repayment installment amount |
| **Loans** | `due_date` | Date | No | Next payment due date |
| **Loans** | `status` | Enum | No | `ACTIVE`, `OVERDUE`, `PAID`, `DEFAULTED` |

---

## 10. EXHAUSTIVE CRUD OPERATIONS MATRIX

| Module | Entity | Create (C) | Read (R) | Update (U) | Delete (D) |
|---|---|---|---|---|---|
| **Auth** | Tenant Store | Self-serve `/signup` registration form | Profile display in header badge | Update shop name, support phone, logo in Store Settings | Deactivate store account via SuperAdmin |
| **Fleet** | Enrolled Device | Manual Enrollment Modal or 6-Tap QR Provisioning | Master Fleet Table & Deep Inspector Side-Sheet | Update device nickname, policy profile, or assigned SIM | Unenroll & Delete Device: strips DPC & removes from DB |
| **Security** | Lock / Unlock | Triggered via `LOCK` button or Auto-Dunning cron | Status displayed in table badge (`LOCKED`/`NORMAL`) | Status transition via `UNLOCK` button or payment webhook | N/A (State transition) |
| **KYC** | Customer Info | Bound during device enrollment modal | Displayed in Table column & Inspector Tab 2 | Inline modal to update customer phone numbers or address | Remove customer binding upon device unenrollment |
| **Finance** | EMI Schedule | Created with loan parameters during device sale | Displayed in EMI module table & Inspector Tab 3 | Mark payment paid, adjust grace days, edit EMI amount | Void loan contract upon early settlement |
| **Kiosk** | Lock Policy | Create custom lockscreen theme with UPI QR code | Displayed in Live Smartphone Mockup | Edit warning text, merchant phone, or UPI ID | Reset lockscreen policy to default template |
| **Apps** | DPC Software | Upload new APK binary (`/download/app-release.apk`) | Version checks via `/api/app-version` endpoint | Silent In-Place OTA update via PackageInstaller | N/A |
| **SMS** | 0-KB Commands | Dispatch new SMS via 0-KB SMS Hub | View SMS delivery log and receipts | N/A | Clear SMS dispatch audit logs |

---

## 11. STATE MANAGEMENT, SOCKET.IO REAL-TIME EVENTS & API ENDPOINTS

### 11.1 Real-Time WebSocket Architecture (Socket.io)

```
[FRONTEND DASHBOARD]                 [BACKEND GATEWAY]                  [PHYSICAL ANDROID DPC]
        |                                    |                                    |
        |---- join_shop { shopCode } ------->|                                    |
        |<--- room_joined -------------------|                                    |
        |                                    |<--- register { deviceId, imei } ---|
        |<--- device_registered ------------|                                    |
        |                                    |<--- device_telemetry { vitals } ---|
        |<--- telemetry_update --------------|                                    |
        |                                    |                                    |
        |---- dispatch_command { LOCK } ---->|                                    |
        |                                    |---- command { action: 'LOCK' } --->|
        |                                    |<--- command_ack { 'LOCKED' } ------|
        |<--- status_change { 'LOCKED' } ----|                                    |
```

#### Event Catalog:
- `join_shop`: Dashboard joins tenant room (`shopCode`).
- `device_registered`: Broadcast when a new phone activates.
- `device_telemetry`: Real-time updates for battery %, charging status, Wi-Fi, and GPS coordinates.
- `dispatch_command`: Dashboard sends `LOCK`, `UNLOCK`, `SIREN`, `REBOOT`, or `WIPE`.
- `status_change`: Instant notification that device has locked or unlocked.
- `disconnect`: Updates device socket dot to gray offline.

### 11.2 Exhaustive REST API Route Catalog:

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

*End of Complete Frontend Design System & Specification.*
