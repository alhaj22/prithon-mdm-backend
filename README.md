# Prithon Tech Enterprise MDM Control Plane

Production Device Management & Finance Control Platform backend hub for Prithon Tech.
Engineered for real-time Kiosk locking, WebSocket device telemetry, and Day-0 Android Enterprise QR provisioning.

## Deployment on Render

This repository is optimized for one-click deployment on [Render](https://render.com).

### Render Service Settings:
- **Environment**: Node
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Plan**: Free / Starter Web Service

### Features Included:
- Real-time Socket.IO communication with DPC agents
- Android Enterprise 6-tap QR provisioning payload generator
- RBI-compliant emergency dialer support (112 / 100 / 108)
- Automated payment settlement webhook integration (`/api/webhook/payment-received`)
- Full regulatory legal disclosures (`/privacy` and `/terms`)

## License
Proprietary Enterprise License - Copyright (c) 2026 Prithon Tech Private Limited. All Rights Reserved.
