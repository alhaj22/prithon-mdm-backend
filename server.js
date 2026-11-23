const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const cookieParser = require('cookie-parser');

const { createTenant, authenticateTenant, findTenantById, findTenantByCode } = require('./src/models/tenantStore');
const { generateToken, verifyToken, authMiddleware } = require('./src/middleware/auth');
const db = require('./src/db/db');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Explicit Frontend Page Routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'public', 'dashboard.html'));
});

// Serve APK downloads for Android Enterprise Setup Wizard
const apkDir = path.join(__dirname, 'apk');
if (!fs.existsSync(apkDir)) {
    fs.mkdirSync(apkDir, { recursive: true });
}
app.get('/download/app-release.apk', (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = req.headers['user-agent'] || 'Unknown';
    console.log(`[PROVISIONING DOWNLOAD] Device at IP ${ip} downloading app-release.apk (UA: ${ua})`);
    next();
});
app.use('/download', express.static(apkDir));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', credentials: true } });

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

// In-Memory & Persistent Fleet State
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const stateFilePath = path.join(dataDir, 'fleet_state.json');

let connectedDevices = {};
if (fs.existsSync(stateFilePath)) {
    try {
        connectedDevices = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
        for (const k in connectedDevices) {
            connectedDevices[k].online = false;
            connectedDevices[k].socketId = null;
        }
    } catch (e) {
        connectedDevices = {};
    }
}

async function persistDeviceToPostgres(dev) {
    if (!db.isPostgresConnected()) return;
    try {
        const queryText = `
            INSERT INTO devices (
                device_id, tenant_id, tenant_code, brand, model, battery, android_version,
                status, online, ip, last_seen, is_device_owner, customer_name, customer_phone,
                loan_id, emi_amount, due_date, entered_imei, hardware_imei, imei_verified, imei_status, apps, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW()
            )
            ON CONFLICT (device_id) DO UPDATE SET
                tenant_id = EXCLUDED.tenant_id,
                tenant_code = EXCLUDED.tenant_code,
                brand = EXCLUDED.brand,
                model = EXCLUDED.model,
                battery = EXCLUDED.battery,
                android_version = EXCLUDED.android_version,
                status = EXCLUDED.status,
                online = EXCLUDED.online,
                ip = EXCLUDED.ip,
                last_seen = EXCLUDED.last_seen,
                is_device_owner = EXCLUDED.is_device_owner,
                customer_name = COALESCE(EXCLUDED.customer_name, devices.customer_name),
                customer_phone = COALESCE(EXCLUDED.customer_phone, devices.customer_phone),
                loan_id = COALESCE(EXCLUDED.loan_id, devices.loan_id),
                emi_amount = COALESCE(EXCLUDED.emi_amount, devices.emi_amount),
                due_date = COALESCE(EXCLUDED.due_date, devices.due_date),
                entered_imei = COALESCE(EXCLUDED.entered_imei, devices.entered_imei),
                hardware_imei = COALESCE(EXCLUDED.hardware_imei, devices.hardware_imei),
                imei_verified = EXCLUDED.imei_verified,
                imei_status = EXCLUDED.imei_status,
                apps = COALESCE(EXCLUDED.apps, devices.apps),
                updated_at = NOW();
        `;
        await db.query(queryText, [
            dev.deviceId,
            dev.tenantId || null,
            dev.tenantCode || null,
            dev.brand || 'Android',
            dev.model || 'Device',
            dev.battery || 100,
            dev.androidVersion || 'Unknown',
            dev.status || 'NORMAL',
            dev.online || false,
            dev.ip || null,
            dev.lastSeen || new Date().toISOString(),
            dev.isDeviceOwner || false,
            dev.customerName || null,
            dev.customerPhone || null,
            dev.loanId || null,
            dev.emiAmount || null,
            dev.dueDate || null,
            dev.enteredImei || null,
            dev.hardwareImei || null,
            dev.imeiVerified || false,
            dev.imeiStatus || 'PENDING',
            JSON.stringify(dev.apps || [])
        ]);
    } catch (e) {
        console.error('[POSTGRESQL] Failed to persist device:', e.message);
    }
}

function saveFleetState() {
    try {
        const tmpPath = `${stateFilePath}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(connectedDevices, null, 2));
        fs.renameSync(tmpPath, stateFilePath);

        if (db.isPostgresConnected()) {
            for (const dev of Object.values(connectedDevices)) {
                persistDeviceToPostgres(dev).catch(() => {});
            }
        }
    } catch (e) {
        console.error('Failed to save fleet state:', e);
    }
}

// Helper: Luhn checksum validator for IMEI
function isValidImei(imei) {
    if (!imei) return false;
    const clean = String(imei).trim().replace(/[^0-9]/g, '');
    if (clean.length !== 15) return false;
    let sum = 0;
    for (let i = 0; i < 15; i++) {
        let d = parseInt(clean[i], 10);
        if (i % 2 === 1) {
            d *= 2;
            if (d > 9) d = (d % 10) + 1;
        }
        sum += d;
    }
    return sum % 10 === 0;
}

// Helper: Get URL-safe Base64 SHA-256 of the signing certificate
function getApkSignatureChecksum() {
    const certHex = '050141285b5ebf4d1324491abf5b4175d4fb17748c0a479726aee113d9018fd7';
    return Buffer.from(certHex, 'hex')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

// Helper: Get fleet devices filtered strictly by tenantId
function getTenantDevices(tenantId) {
    const filtered = {};
    for (const id in connectedDevices) {
        if (connectedDevices[id].tenantId === tenantId) {
            filtered[id] = connectedDevices[id];
        }
    }
    return filtered;
}

// Helper: Broadcast device updates exclusively to a specific tenant room
function emitTenantDeviceUpdate(tenantId) {
    if (!tenantId) return;
    const tenantDevices = getTenantDevices(tenantId);
    io.to(`tenant_${tenantId}`).emit('device_list_updated', tenantDevices);
}

// ==========================================
// AUTHENTICATION API ROUTES
// ==========================================

// 1. Retailer Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { shopName, ownerName, email, phone, password } = req.body;
        if (!shopName || !ownerName || !email || !password) {
            return res.status(400).json({ error: 'Shop Name, Owner Name, Email, and Password are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        const tenant = await createTenant({ shopName, ownerName, email, phone, password });
        const token = generateToken(tenant);

        res.cookie('prithon_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: 'Shop account created successfully.',
            token,
            user: tenant
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(400).json({ error: err.message || 'Signup failed.' });
    }
});

// 2. Retailer Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and Password are required.' });
        }

        const tenant = await authenticateTenant(email, password);
        const token = generateToken(tenant);

        res.cookie('prithon_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: tenant
        });
    } catch (err) {
        res.status(401).json({ error: err.message || 'Authentication failed.' });
    }
});

// 3. Current User Profile
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ success: true, user: req.user });
});

// 4. Logout
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('prithon_token');
    res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================
// DYNAMIC PROVISIONING PAYLOAD (QR / DPC)
// ==========================================

app.get('/api/provisioning-payload', async (req, res) => {
    const { ssid, password, host, tenantId, tenantCode } = req.query;
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const reqHost = req.headers['x-forwarded-host'] || req.headers.host;
    const activeHost = host || reqHost || `${SERVER_HOST}:${PORT}`;
    const baseOrigin = activeHost.startsWith('http') ? activeHost : `${proto}://${activeHost}`;

    const downloadLocation = `${baseOrigin}/download/app-release.apk`;
    const signatureChecksum = getApkSignatureChecksum();

    // Determine target tenant code
    let resolvedTenantId = tenantId || null;
    let resolvedTenantCode = tenantCode || null;

    if (tenantCode && !resolvedTenantId) {
        const tenant = await findTenantByCode(tenantCode);
        if (tenant) {
            resolvedTenantId = tenant.id;
            resolvedTenantCode = tenant.tenantCode;
        }
    } else if (tenantId && !resolvedTenantCode) {
        const tenant = await findTenantById(tenantId);
        if (tenant) {
            resolvedTenantCode = tenant.tenantCode;
        }
    }

    const payload = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.prithon.dpc/com.prithon.dpc.receivers.PrithonAdminReceiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": signatureChecksum,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": downloadLocation,
        "android.app.extra.PROVISIONING_MODE": 1,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "tenantId": resolvedTenantId || "",
            "tenantCode": resolvedTenantCode || "",
            "serverUrl": baseOrigin
        }
    };

    if (ssid && ssid.trim().length > 0) {
        payload["android.app.extra.PROVISIONING_WIFI_SSID"] = ssid.trim();
        payload["android.app.extra.PROVISIONING_WIFI_PASSWORD"] = password || "";
    }

    res.json({
        success: true,
        host: activeHost,
        tenantId: resolvedTenantId,
        tenantCode: resolvedTenantCode,
        payload
    });
});

// ==========================================
// MULTI-TENANT DEVICE MANAGEMENT APIs
// ==========================================

// Helper: Bind device to tenant and verify IMEI
async function processDeviceRegistration(data, socketId = null, remoteIp = null) {
    const {
        deviceId,
        tenantId,
        tenantCode,
        brand,
        model,
        battery,
        androidVersion,
        status,
        isDeviceOwner,
        customerName,
        customerPhone,
        loanId,
        emiAmount,
        dueDate,
        enteredImei,
        hardwareImei
    } = data;

    if (!deviceId) return null;

    const existing = connectedDevices[deviceId] || {};

    // Resolve tenant binding
    let finalTenantId = tenantId || null;
    let finalTenantCode = tenantCode || null;

    if (finalTenantCode) {
        const found = await findTenantByCode(finalTenantCode);
        if (found) {
            finalTenantId = found.id;
            finalTenantCode = found.tenantCode;
        }
    } else if (finalTenantId) {
        const found = await findTenantById(finalTenantId);
        if (found) {
            finalTenantCode = found.tenantCode;
        }
    } else {
        finalTenantId = existing.tenantId || null;
        finalTenantCode = existing.tenantCode || null;
    }

    // IMEI dual-tracking & verification
    const cleanEnteredImei = (enteredImei || existing.enteredImei || '').replace(/[^0-9]/g, '');
    const cleanHardwareImei = (hardwareImei || existing.hardwareImei || '').replace(/[^0-9]/g, '');

    let imeiVerified = false;
    let imeiStatus = 'PENDING';

    if (cleanEnteredImei.length === 15 && cleanHardwareImei.length === 15) {
        imeiVerified = (cleanEnteredImei === cleanHardwareImei);
        imeiStatus = imeiVerified ? 'VERIFIED_MATCH' : 'MISMATCH_WARNING';
    } else if (cleanEnteredImei.length === 15 && isValidImei(cleanEnteredImei)) {
        imeiVerified = true;
        imeiStatus = 'RETAILER_VERIFIED';
    } else if (cleanHardwareImei.length === 15) {
        imeiVerified = true;
        imeiStatus = 'HARDWARE_DETECTED';
    }

    connectedDevices[deviceId] = {
        ...existing,
        deviceId,
        tenantId: finalTenantId,
        tenantCode: finalTenantCode,
        socketId: socketId || existing.socketId || null,
        brand: brand || existing.brand || 'Android',
        model: model || existing.model || 'Device',
        battery: battery ?? existing.battery ?? 100,
        androidVersion: androidVersion || existing.androidVersion || 'Unknown',
        status: status || existing.status || 'NORMAL',
        online: socketId ? true : existing.online || false,
        ip: remoteIp || existing.ip || '127.0.0.1',
        lastSeen: new Date().toLocaleTimeString(),
        isDeviceOwner: isDeviceOwner ?? existing.isDeviceOwner ?? false,
        customerName: customerName || existing.customerName || '',
        customerPhone: customerPhone || existing.customerPhone || '',
        loanId: loanId || existing.loanId || '',
        emiAmount: emiAmount || existing.emiAmount || '',
        dueDate: dueDate || existing.dueDate || '',
        enteredImei: cleanEnteredImei,
        hardwareImei: cleanHardwareImei,
        imeiVerified,
        imeiStatus
    };

    saveFleetState();

    if (finalTenantId) {
        emitTenantDeviceUpdate(finalTenantId);
    }

    return connectedDevices[deviceId];
}

// REST: Get devices strictly for the authenticated tenant
app.get('/api/devices', authMiddleware, (req, res) => {
    const tenantDevices = getTenantDevices(req.user.id);
    res.json(tenantDevices);
});

// REST: Register device via HTTP (Fallback / Enrollment Hook)
app.post('/api/devices/register', async (req, res) => {
    const device = await processDeviceRegistration(req.body, null, req.ip);
    if (!device) {
        return res.status(400).json({ error: 'Device ID is required.' });
    }
    res.json({ success: true, device });
});

// REST: Get Installed Applications for a specific device (Protected)
app.get('/api/devices/:deviceId/apps', authMiddleware, (req, res) => {
    const { deviceId } = req.params;
    const dev = connectedDevices[deviceId];
    if (!dev) return res.status(404).json({ error: 'Device not found.' });
    if (dev.tenantId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: You do not own this device.' });
    }
    res.json({ success: true, count: dev.apps ? dev.apps.length : 0, apps: dev.apps || [] });
});

// REST: Save/Update Customer KYC & IMEI (Protected)
app.post('/api/devices/:deviceId/customer', authMiddleware, (req, res) => {
    const { deviceId } = req.params;
    const dev = connectedDevices[deviceId];
    if (!dev) return res.status(404).json({ error: 'Device not found.' });
    if (dev.tenantId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: You do not own this device.' });
    }

    const { customerName, customerPhone, loanId, emiAmount, dueDate, enteredImei } = req.body;
    dev.customerName = customerName || dev.customerName || '';
    dev.customerPhone = customerPhone || dev.customerPhone || '';
    dev.loanId = loanId || dev.loanId || '';
    dev.emiAmount = emiAmount || dev.emiAmount || '';
    dev.dueDate = dueDate || dev.dueDate || '';

    if (enteredImei) {
        dev.enteredImei = String(enteredImei).replace(/[^0-9]/g, '');
        if (dev.hardwareImei) {
            dev.imeiVerified = (dev.enteredImei === dev.hardwareImei);
            dev.imeiStatus = dev.imeiVerified ? 'VERIFIED_MATCH' : 'MISMATCH_WARNING';
        } else {
            dev.imeiVerified = (dev.enteredImei.length === 15 && isValidImei(dev.enteredImei));
            dev.imeiStatus = dev.imeiVerified ? 'RETAILER_VERIFIED' : 'PENDING';
        }
    }

    saveFleetState();
    emitTenantDeviceUpdate(req.user.id);
    res.json({ success: true, device: dev });
});

// REST: Remote Command Dispatch (Protected & Strictly Isolated)
app.post('/api/devices/:deviceId/command', authMiddleware, (req, res) => {
    const { deviceId } = req.params;
    const { command } = req.body; // 'LOCK', 'UNLOCK', 'ALARM'

    const target = connectedDevices[deviceId];
    if (!target) {
        return res.status(404).json({ error: 'Device is offline or not registered.' });
    }

    // STRICT MULTI-TENANT AUTHORIZATION CHECK
    if (target.tenantId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: This device does not belong to your shop account.' });
    }

    console.log(`[DISPATCH COMMAND] Shop ${req.user.shopName} (${req.user.tenantCode}) sending ${command} to device: ${deviceId}`);

    if (target.socketId) {
        io.to(target.socketId).emit('server_command', {
            command,
            customer: {
                name: target.customerName || '',
                phone: target.customerPhone || '',
                loanId: target.loanId || '',
                emiAmount: target.emiAmount || ''
            },
            timestamp: Date.now()
        });
    }

    // Optimistically update status
    if (command === 'LOCK') target.status = 'LOCKED';
    if (command === 'UNLOCK') target.status = 'NORMAL';
    saveFleetState();
    emitTenantDeviceUpdate(req.user.id);

    res.json({ success: true, message: `Command ${command} dispatched to device.` });
});

// REST: Payment Gateway Webhook (Auto-Unlock)
app.post('/api/webhook/payment-received', (req, res) => {
    const { deviceId, status, loanId } = req.body;

    let target = null;
    if (deviceId && connectedDevices[deviceId]) {
        target = connectedDevices[deviceId];
    } else if (loanId) {
        for (const id in connectedDevices) {
            if (connectedDevices[id].loanId === loanId) {
                target = connectedDevices[id];
                break;
            }
        }
    }

    if (status === 'SUCCESS' && target) {
        console.log(`[PAYMENT WEBHOOK] Payment verified for ${target.deviceId}. Unlocking device automatically.`);
        if (target.socketId) {
            io.to(target.socketId).emit('server_command', { command: 'UNLOCK' });
        }
        target.status = 'NORMAL';
        saveFleetState();
        if (target.tenantId) {
            emitTenantDeviceUpdate(target.tenantId);
        }
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

// ==========================================
// REAL-TIME WEBSOCKET HUB (MULTI-TENANT)
// ==========================================

io.on('connection', (socket) => {
    // Authenticated Dashboard joins its isolated tenant room
    socket.on('join_tenant', ({ token }) => {
        const decoded = verifyToken(token);
        if (decoded && decoded.tenantId) {
            const roomName = `tenant_${decoded.tenantId}`;
            socket.join(roomName);
            socket.tenantId = decoded.tenantId;
            console.log(`[DASHBOARD JOINED] Tenant ${decoded.shopName} (${decoded.tenantCode}) joined room ${roomName}`);
            // Send initial tenant device list
            const tenantDevices = getTenantDevices(decoded.tenantId);
            socket.emit('device_list_updated', tenantDevices);
        }
    });

    // Register newly connected DPC Agent
    socket.on('register_device', async (data) => {
        const device = await processDeviceRegistration(data, socket.id, socket.handshake.address);
        if (device) {
            console.log(`[DPC REGISTERED] ${device.brand} ${device.model} (${device.deviceId}) - Tenant: ${device.tenantCode || 'Unassigned'}`);
        }
    });

    // Customer details submitted from Phone
    socket.on('register_customer', async (data) => {
        const device = await processDeviceRegistration(data, socket.id, socket.handshake.address);
        if (device) {
            console.log(`[CUSTOMER SYNCED] ${device.customerName} on device ${device.deviceId} - Status: ${device.status}`);
        }
    });

    // Device telemetry status change (e.g., NORMAL -> LOCKED)
    socket.on('device_status_changed', ({ deviceId, status }) => {
        if (connectedDevices[deviceId]) {
            connectedDevices[deviceId].status = status;
            connectedDevices[deviceId].online = true;
            connectedDevices[deviceId].socketId = socket.id;
            connectedDevices[deviceId].lastSeen = new Date().toLocaleTimeString();
            saveFleetState();
            console.log(`[STATUS CHANGE] Device ${deviceId} -> ${status}`);
            if (connectedDevices[deviceId].tenantId) {
                emitTenantDeviceUpdate(connectedDevices[deviceId].tenantId);
            }
        }
    });

    // Installed Applications Inventory from Phone
    socket.on('apps_inventory', ({ deviceId, apps }) => {
        if (connectedDevices[deviceId]) {
            connectedDevices[deviceId].apps = apps || [];
            saveFleetState();
            if (connectedDevices[deviceId].tenantId) {
                emitTenantDeviceUpdate(connectedDevices[deviceId].tenantId);
            }
        }
    });

    // Periodic heartbeat from phone
    socket.on('heartbeat', ({ deviceId, battery, status, customerName, customerPhone, loanId, emiAmount, enteredImei, hardwareImei }) => {
        if (connectedDevices[deviceId]) {
            if (battery !== undefined) connectedDevices[deviceId].battery = battery;
            if (status !== undefined) connectedDevices[deviceId].status = status;
            if (customerName) connectedDevices[deviceId].customerName = customerName;
            if (customerPhone) connectedDevices[deviceId].customerPhone = customerPhone;
            if (loanId) connectedDevices[deviceId].loanId = loanId;
            if (emiAmount) connectedDevices[deviceId].emiAmount = emiAmount;
            if (enteredImei) connectedDevices[deviceId].enteredImei = enteredImei;
            if (hardwareImei) connectedDevices[deviceId].hardwareImei = hardwareImei;
            connectedDevices[deviceId].online = true;
            connectedDevices[deviceId].socketId = socket.id;
            connectedDevices[deviceId].lastSeen = new Date().toLocaleTimeString();
            if (connectedDevices[deviceId].tenantId) {
                emitTenantDeviceUpdate(connectedDevices[deviceId].tenantId);
            }
        }
    });

    socket.on('disconnect', () => {
        for (const [id, dev] of Object.entries(connectedDevices)) {
            if (dev.socketId === socket.id) {
                console.log(`[-] Device connection closed: ${dev.brand} ${dev.model} (${id})`);
                dev.online = false;
                dev.socketId = null;
                dev.lastSeen = new Date().toLocaleTimeString();
                if (dev.tenantId) {
                    emitTenantDeviceUpdate(dev.tenantId);
                }
                break;
            }
        }
    });
});

// Start Server
server.listen(PORT, '0.0.0.0', async () => {
    console.log('====================================================');
    console.log(`  PRITHON TECH | ENTERPRISE MULTI-TENANT MDM`);
    console.log(`  Local Server IP: http://${SERVER_HOST}:${PORT}`);
    console.log(`  Login Page:      http://${SERVER_HOST}:${PORT}/login`);
    console.log(`  Signup Page:     http://${SERVER_HOST}:${PORT}/signup`);
    console.log(`  Dashboard:       http://${SERVER_HOST}:${PORT}/dashboard`);
    console.log(`  APK Download:    http://${SERVER_HOST}:${PORT}/download/app-release.apk`);
    console.log('====================================================');

    // Initialize PostgreSQL
    const pgConnected = await db.initDatabase();
    if (pgConnected) {
        try {
            const res = await db.query('SELECT * FROM devices');
            for (const row of res.rows) {
                if (!connectedDevices[row.device_id]) {
                    connectedDevices[row.device_id] = {
                        deviceId: row.device_id,
                        tenantId: row.tenant_id,
                        tenantCode: row.tenant_code,
                        brand: row.brand,
                        model: row.model,
                        battery: row.battery,
                        androidVersion: row.android_version,
                        status: row.status,
                        online: false,
                        socketId: null,
                        ip: row.ip,
                        lastSeen: row.last_seen,
                        isDeviceOwner: row.is_device_owner,
                        customerName: row.customer_name,
                        customerPhone: row.customer_phone,
                        loanId: row.loan_id,
                        emiAmount: row.emi_amount,
                        dueDate: row.due_date,
                        enteredImei: row.entered_imei,
                        hardwareImei: row.hardware_imei,
                        imeiVerified: row.imei_verified,
                        imeiStatus: row.imei_status,
                        apps: typeof row.apps === 'string' ? JSON.parse(row.apps) : (row.apps || [])
                    };
                }
            }
            console.log(`[POSTGRESQL] Loaded ${res.rows.length} devices from PostgreSQL database.`);
        } catch (e) {
            console.warn('[POSTGRESQL WARNING] Failed loading devices:', e.message);
        }
    }
});
