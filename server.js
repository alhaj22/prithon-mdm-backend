const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Serve APK downloads for Android Enterprise Setup Wizard
const apkDir = path.join(__dirname, 'apk');
if (!fs.existsSync(apkDir)) {
    fs.mkdirSync(apkDir, { recursive: true });
}
app.use('/download', express.static(apkDir));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Detect active local IPv4 address
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

const SERVER_HOST = getLocalIpAddress();
const PORT = process.env.PORT || 4000;

// In-Memory Fleet State (Production uses Redis Cluster)
let connectedDevices = {};

// Helper: Calculate URL-safe Base64 SHA-256 for Android Enterprise Provisioning
function getApkChecksum() {
    const apkPath = path.join(apkDir, 'app-debug.apk');
    if (!fs.existsSync(apkPath)) {
        return 'BUILD_APK_FIRST';
    }
    const fileBuffer = fs.readFileSync(apkPath);
    return crypto.createHash('sha256').update(fileBuffer).digest('base64url');
}

// 1. Android Enterprise 6-Tap QR Provisioning Endpoint
app.get('/api/provisioning-payload', (req, res) => {
    const { ssid, password, host } = req.query;
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const reqHost = req.headers['x-forwarded-host'] || req.headers.host;
    const activeHost = host || reqHost || `${SERVER_HOST}:${PORT}`;
    const baseOrigin = activeHost.startsWith('http') ? activeHost : `${proto}://${activeHost}`;
    
    // High-Availability Global CDN download URL (Permanent, 0.95s download in India)
    const permanentCdnUrl = "https://github.com/alhaj22/prithon-dpc/releases/download/v1.0.0/app-debug.apk";
    const downloadLocation = req.query.local === 'true' ? `${baseOrigin}/download/app-debug.apk` : permanentCdnUrl;
    const checksum = "ylwvEXy6aiJ5dNuh1M9xRGFjsJDzWz9a9kbmF72WDwY";

    const payload = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.prithon.dpc/com.prithon.dpc.receivers.PrithonAdminReceiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_NAME": "com.prithon.dpc",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": downloadLocation,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": checksum,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "YomjV2Ij-oZCuk36cEAgpha11o7fPOokNGXu8yLZ-hg",
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "serverEndpoint": baseOrigin,
            "token": "tok_" + Date.now(),
            "autoSeal": true
        }
    };

    // Only inject Wi-Fi if explicitly specified
    if (ssid && ssid.trim().length > 0) {
        payload["android.app.extra.PROVISIONING_WIFI_SSID"] = ssid.trim();
        payload["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = password || "";
    }

    res.json({ success: true, host: activeHost, port: PORT, checksum, payload });
});

// 2. Realtime WebSocket Hub (Sub-second communication)
io.on('connection', (socket) => {
    console.log(`[+] Socket connected: ${socket.id}`);

    // Immediately send current fleet list to newly connected dashboard client
    socket.emit('device_list_updated', connectedDevices);

    // Register newly connected DPC Agent
    socket.on('register_device', (device) => {
        connectedDevices[device.deviceId] = {
            socketId: socket.id,
            brand: device.brand || 'Android',
            model: device.model || 'Device',
            battery: device.battery ?? 100,
            androidVersion: device.androidVersion || 'Unknown',
            status: device.status || 'NORMAL',
            online: true,
            ip: socket.handshake.address,
            lastSeen: new Date().toLocaleTimeString(),
            isDeviceOwner: device.isDeviceOwner ?? true
        };
        console.log(`[DEVICE REGISTERED] ${device.brand} ${device.model} (${device.deviceId}) - Status: ${device.status}`);
        io.emit('device_list_updated', connectedDevices);
    });

    // Device telemetry status change (e.g., NORMAL -> LOCKED)
    socket.on('device_status_changed', ({ deviceId, status }) => {
        if (connectedDevices[deviceId]) {
            connectedDevices[deviceId].status = status;
            connectedDevices[deviceId].online = true;
            connectedDevices[deviceId].socketId = socket.id;
            connectedDevices[deviceId].lastSeen = new Date().toLocaleTimeString();
            console.log(`[STATUS CHANGE] Device ${deviceId} -> ${status}`);
            io.emit('device_list_updated', connectedDevices);
        }
    });

    // Periodic heartbeat from phone
    socket.on('heartbeat', ({ deviceId, battery, status }) => {
        if (connectedDevices[deviceId]) {
            if (battery !== undefined) connectedDevices[deviceId].battery = battery;
            if (status !== undefined) connectedDevices[deviceId].status = status;
            connectedDevices[deviceId].online = true;
            connectedDevices[deviceId].socketId = socket.id;
            connectedDevices[deviceId].lastSeen = new Date().toLocaleTimeString();
            io.emit('device_list_updated', connectedDevices);
        }
    });

    socket.on('disconnect', () => {
        for (const [id, dev] of Object.entries(connectedDevices)) {
            if (dev.socketId === socket.id) {
                console.log(`[-] Device connection closed: ${dev.brand} ${dev.model} (${id})`);
                dev.online = false;
                dev.socketId = null;
                dev.lastSeen = new Date().toLocaleTimeString();
                break;
            }
        }
        io.emit('device_list_updated', connectedDevices);
    });
});

// 2b. Fleet REST API Endpoint
app.get('/api/devices', (req, res) => {
    res.json(connectedDevices);
});

// 3. REST API to trigger Remote Commands
app.post('/api/devices/:deviceId/command', (req, res) => {
    const { deviceId } = req.params;
    const { command } = req.body; // 'LOCK', 'UNLOCK', 'ALARM'

    const target = connectedDevices[deviceId];
    if (!target) {
        return res.status(404).json({ error: 'Device is offline or not registered' });
    }

    console.log(`[DISPATCH COMMAND] Sending ${command} to device: ${deviceId}`);
    io.to(target.socketId).emit('server_command', { command, timestamp: Date.now() });

    // Optimistically update status
    if (command === 'LOCK') target.status = 'LOCKED';
    if (command === 'UNLOCK') target.status = 'NORMAL';
    io.emit('device_list_updated', connectedDevices);

    res.json({ success: true, message: `Command ${command} dispatched to device.` });
});

// 4. Payment Gateway Webhook (Auto-Unlock in Sub-3 Seconds)
app.post('/api/webhook/payment-received', (req, res) => {
    const { deviceId, status } = req.body;
    if (status === 'SUCCESS' && connectedDevices[deviceId]) {
        console.log(`[PAYMENT WEBHOOK] Payment verified for ${deviceId}. Unlocking device automatically.`);
        io.to(connectedDevices[deviceId].socketId).emit('server_command', { command: 'UNLOCK' });
        connectedDevices[deviceId].status = 'NORMAL';
        io.emit('device_list_updated', connectedDevices);
        return res.json({ success: true, message: 'Device unlocked via automated payment webhook.' });
    }
    res.json({ received: true });
});

// Legal and Compliance Routes
app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'terms.html'));
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
    console.log('====================================================');
    console.log(`  PRITHON TECH | ENTERPRISE MDM CONTROL PLANE`);
    console.log(`  Local Server IP: http://${SERVER_HOST}:${PORT}`);
    console.log(`  Dashboard:       http://${SERVER_HOST}:${PORT}/`);
    console.log(`  APK Download:    http://${SERVER_HOST}:${PORT}/download/app-debug.apk`);
    console.log('====================================================');
});
