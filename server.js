require('dotenv').config();
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
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
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

// App Version Check API for in-app automatic updates
app.get('/api/app-version', (req, res) => {
    const proto = req.headers['x-forwarded-proto'] || req.protocol;
    const baseOrigin = `${proto}://${req.get('host')}`;
    res.json({
        versionCode: 3,
        versionName: "1.2.0",
        downloadUrl: `${baseOrigin}/download/app-release.apk`,
        releaseNotes: "Green lock screen, guided permission pop-up wizard, and automatic in-app updates"
    });
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
                device_id, tenant_id, tenant_code, company_id, company_code, brand, model, battery, android_version,
                status, online, ip, last_seen, is_device_owner, customer_name, customer_phone,
                loan_id, emi_amount, due_date, entered_imei, hardware_imei, imei_verified, imei_status, apps,
                latitude, longitude, location_accuracy, location_updated_at, location_address, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
                $23, $24, $25, $26, $27, $28, $29, NOW()
            )
            ON CONFLICT (device_id) DO UPDATE SET
                tenant_id = EXCLUDED.tenant_id,
                tenant_code = EXCLUDED.tenant_code,
                company_id = EXCLUDED.company_id,
                company_code = EXCLUDED.company_code,
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
                latitude = COALESCE(EXCLUDED.latitude, devices.latitude),
                longitude = COALESCE(EXCLUDED.longitude, devices.longitude),
                location_accuracy = COALESCE(EXCLUDED.location_accuracy, devices.location_accuracy),
                location_updated_at = COALESCE(EXCLUDED.location_updated_at, devices.location_updated_at),
                location_address = COALESCE(EXCLUDED.location_address, devices.location_address),
                updated_at = NOW();
        `;
        let validTenantId = dev.companyId || dev.tenantId || null;
        if (validTenantId) {
            try {
                const tCheck = await db.query('SELECT id FROM tenants WHERE id = $1', [validTenantId]);
                if (tCheck.rows.length === 0) {
                    validTenantId = null;
                }
            } catch (err) {
                validTenantId = null;
            }
        }
        const validCode = dev.companyCode || dev.tenantCode || null;

        await db.query(queryText, [
            dev.deviceId,
            validTenantId,
            validCode,
            validTenantId,
            validCode,
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
            JSON.stringify(dev.apps || []),
            dev.latitude !== undefined && dev.latitude !== null ? dev.latitude : null,
            dev.longitude !== undefined && dev.longitude !== null ? dev.longitude : null,
            dev.locationAccuracy !== undefined && dev.locationAccuracy !== null ? dev.locationAccuracy : null,
            dev.locationUpdatedAt || null,
            dev.locationAddress || null
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

// Helper: Get fleet devices filtered strictly by companyId / tenantId
function getTenantDevices(tenantId) {
    const filtered = {};
    for (const id in connectedDevices) {
        const d = connectedDevices[id];
        const devCompanyId = d.companyId || d.tenantId;
        const devCompanyCode = d.companyCode || d.tenantCode;
        if (devCompanyId === tenantId || (tenantId === 'tenant_1fa9abb03962dff6' && (!devCompanyId || devCompanyCode === 'ALH-9565'))) {
            filtered[id] = d;
        }
    }
    return filtered;
}

// Helper: Broadcast device updates exclusively to a specific company room
function emitTenantDeviceUpdate(tenantId) {
    if (!tenantId) return;
    const tenantDevices = getTenantDevices(tenantId);
    io.to(`tenant_${tenantId}`).emit('device_list_updated', tenantDevices);
}

// Enterprise Security & Compliance Audit Logger
async function logAudit({ companyId, tenantId, deviceId, eventType, req, payload = {} }) {
    const resolvedCompanyId = companyId || tenantId || (req?.user ? (req.user.companyId || req.user.id || req.user.tenantId) : null);
    const ip = req ? (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '127.0.0.1') : 'SYSTEM';

    if (db.isPostgresConnected() && resolvedCompanyId) {
        try {
            await db.query(
                `INSERT INTO audit_logs (tenant_id, company_id, device_id, event_type, ip_address, payload, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
                [resolvedCompanyId, resolvedCompanyId, deviceId || null, eventType, ip, JSON.stringify(payload)]
            );
        } catch (e) {
            console.warn('[AUDIT LOG ERROR]', e.message);
        }
    }
}

// ==========================================
// PEARL SMS OTP VERIFICATION ENGINE
// ==========================================
const PEARLSMS_API_KEY = process.env.PEARLSMS_API_KEY || 'b3e9a5bb160c4299a0950e803c724916';
const PEARLSMS_API_URL = process.env.PEARLSMS_API_URL || 'http://sms.pearlsms.com/public/sms/send';
const PEARLSMS_SENDER_ID = process.env.PEARLSMS_SENDER_ID || 'SPPLFW';
const PEARLSMS_SMS_TYPE = process.env.PEARLSMS_SMS_TYPE || 'TRANS';

// In-memory OTP storage: cleanPhone -> { otp, expiresAt, verified, lastSent }
const otpStore = new Map();

function sanitizePhoneNumber(phone) {
    if (!phone) return null;
    let clean = String(phone).replace(/\D/g, '');
    if (clean.length === 12 && clean.startsWith('91')) {
        clean = clean.substring(2);
    } else if (clean.length === 11 && clean.startsWith('0')) {
        clean = clean.substring(1);
    }
    return clean.length === 10 ? clean : null;
}

async function sendPearlSms(phone, otp) {
    const message = `Your OTP is ${otp}. Use this to verify your mobile number on SPPLFW. Valid for 5 minutes.`;
    const params = new URLSearchParams({
        sender: PEARLSMS_SENDER_ID,
        numbers: phone,
        message: message,
        apikey: PEARLSMS_API_KEY,
        smstype: PEARLSMS_SMS_TYPE
    });

    const url = `${PEARLSMS_API_URL}?${params.toString()}`;
    const response = await fetch(url, { method: 'GET' });
    const json = await response.json().catch(() => null);

    if (!response.ok || (json && json.status === 'ERROR')) {
        throw new Error(json?.errormsg || json?.detail || 'SMS delivery failed');
    }
    return json;
}

// 0. Send OTP API
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        const cleanPhone = sanitizePhoneNumber(phone);
        if (!cleanPhone) {
            return res.status(400).json({ error: 'Please enter a valid 10-digit mobile number.' });
        }

        const existing = otpStore.get(cleanPhone);
        if (existing && Date.now() - existing.lastSent < 30000) {
            const waitSec = Math.ceil((30000 - (Date.now() - existing.lastSent)) / 1000);
            return res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new OTP.` });
        }

        // Generate 6-digit numeric OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

        await sendPearlSms(cleanPhone, otp);

        otpStore.set(cleanPhone, {
            otp,
            expiresAt,
            verified: false,
            lastSent: Date.now()
        });

        console.log(`[PEARL SMS] OTP ${otp} dispatched successfully to ${cleanPhone}`);
        return res.json({
            success: true,
            message: 'OTP sent successfully to your mobile number. Valid for 5 minutes.'
        });
    } catch (err) {
        console.error('[PEARL SMS ERROR]', err);
        return res.status(500).json({ error: `Failed to send SMS: ${err.message || 'SMS Gateway error'}` });
    }
});

// 0.1 Verify OTP API
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const cleanPhone = sanitizePhoneNumber(phone);
        if (!cleanPhone) {
            return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number.' });
        }
        const cleanOtp = String(otp || '').trim();
        if (cleanOtp.length !== 6) {
            return res.status(400).json({ error: 'Please enter a valid 6-digit OTP.' });
        }

        const record = otpStore.get(cleanPhone);
        if (!record || Date.now() > record.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired or was not requested. Please request a new OTP.' });
        }

        if (record.otp !== cleanOtp) {
            return res.status(400).json({ error: 'Incorrect OTP. Please check the code sent to your mobile.' });
        }

        record.verified = true;
        return res.json({ success: true, message: 'Mobile number verified successfully!' });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Verification failed.' });
    }
});

// ==========================================
// AUTHENTICATION API ROUTES
// ==========================================

// 1. Retailer Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { userName, ownerName, email, password, confirmPassword, phone, otp, company, shopName, city, address } = req.body;
        const resolvedUserName = (userName || ownerName || '').trim();
        const resolvedCompany = (company || shopName || '').trim();
        const resolvedEmail = (email || '').trim().toLowerCase();

        if (!resolvedUserName) {
            return res.status(400).json({ error: 'User Name is required.' });
        }
        if (!resolvedEmail) {
            return res.status(400).json({ error: 'Email is required.' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }
        if (confirmPassword && password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match.' });
        }
        if (!resolvedCompany) {
            return res.status(400).json({ error: 'Company name is required.' });
        }

        // Strict Phone & OTP Verification
        const cleanPhone = sanitizePhoneNumber(phone);
        if (!cleanPhone) {
            return res.status(400).json({ error: 'A valid 10-digit mobile number is required.' });
        }

        const cleanOtp = String(otp || '').trim();
        if (!cleanOtp || cleanOtp.length !== 6) {
            return res.status(400).json({ error: 'Please enter the 6-digit OTP sent to your mobile.' });
        }

        const otpRecord = otpStore.get(cleanPhone);
        if (!otpRecord || Date.now() > otpRecord.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired or was not requested. Click "Send OTP" to receive a new code.' });
        }

        if (otpRecord.otp !== cleanOtp) {
            return res.status(400).json({ error: 'Invalid OTP. Please enter the correct 6-digit code received via SMS.' });
        }

        // OTP verified successfully! Delete OTP from cache to avoid reuse
        otpStore.delete(cleanPhone);

        const tenant = await createTenant({
            userName: resolvedUserName,
            ownerName: resolvedUserName,
            email: resolvedEmail,
            password,
            phone: cleanPhone,
            company: resolvedCompany,
            shopName: resolvedCompany,
            city: (city || '').trim(),
            address: (address || '').trim()
        });
        const token = generateToken(tenant);

        await logAudit({
            companyId: tenant.id,
            eventType: 'COMPANY_ACCOUNT_REGISTERED',
            req,
            payload: { company: tenant.companyName, email: tenant.email, userName: tenant.userName }
        });

        res.cookie('prithon_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: 'Company account created successfully.',
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

        await logAudit({
            companyId: tenant.id,
            eventType: 'ADMIN_LOGIN_SUCCESS',
            req,
            payload: { email: tenant.email, company: tenant.companyName, userName: tenant.userName }
        });

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
    let user = null;
    try {
        const token = req.cookies?.prithon_token || req.headers?.authorization?.replace('Bearer ', '');
        if (token) user = jwt.verify(token, JWT_SECRET);
    } catch (e) {}
    if (user) {
        logAudit({ companyId: user.companyId || user.id, eventType: 'ADMIN_LOGOUT', req, payload: { email: user.email } });
    }
    res.clearCookie('prithon_token');
    res.json({ success: true, message: 'Logged out successfully.' });
});

// 5. Enterprise Security & Activity Audit Trail
app.get('/api/audit-logs', authMiddleware, async (req, res) => {
    const companyId = req.user.companyId || req.user.id || req.user.tenantId;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const deviceId = req.query.deviceId || null;

    if (!db.isPostgresConnected()) {
        return res.json({ success: true, count: 0, logs: [] });
    }

    try {
        let queryText = `
            SELECT id, tenant_id as "companyId", company_id as "companyId", device_id as "deviceId",
                   event_type as "eventType", ip_address as "ipAddress", payload, created_at as "createdAt"
            FROM audit_logs
            WHERE (tenant_id = $1 OR company_id = $1)
        `;
        const params = [companyId];

        if (deviceId) {
            params.push(deviceId);
            queryText += ` AND device_id = $2`;
        }

        queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await db.query(queryText, params);
        res.json({ success: true, count: result.rows.length, logs: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Diagnostic DB Status
app.get('/api/db-status', async (req, res) => {
    const isConn = db.isPostgresConnected();
    let testResult = null;
    let error = null;
    try {
        if (db.pool) {
            const client = await db.pool.connect();
            const q = await client.query('SELECT NOW() as time, current_database() as db');
            client.release();
            testResult = q.rows[0];
        } else {
            error = 'db.pool is null';
        }
    } catch (e) {
        error = e.message;
    }
    res.json({
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        databaseUrlMasked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@') : null,
        isConnected: isConn,
        testResult,
        error
    });
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

app.get('/api/provisioning-profile', async (req, res) => {
    let token = req.headers['authorization'];
    let user = null;
    if (token) {
        if (token.startsWith('Bearer ')) token = token.slice(7);
        try {
            user = jwt.verify(token, JWT_SECRET);
        } catch (e) {}
    }

    const { ssid, password, host } = req.query;
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const reqHost = req.headers['x-forwarded-host'] || req.headers.host;
    const activeHost = host || reqHost || `${SERVER_HOST}:${PORT}`;
    const baseOrigin = activeHost.startsWith('http') ? activeHost : `${proto}://${activeHost}`;

    const downloadLocation = `${baseOrigin}/download/app-release.apk`;
    const signatureChecksum = getApkSignatureChecksum();

    let resolvedTenantId = user ? (user.id || user.tenantId) : null;
    let resolvedTenantCode = user ? user.tenantCode : null;

    if (!resolvedTenantCode && req.query.tenantCode) {
        const tenant = await findTenantByCode(req.query.tenantCode);
        if (tenant) {
            resolvedTenantId = tenant.id;
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

    res.json(payload);
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
        hardwareImei,
        latitude,
        longitude,
        accuracy,
        address
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
        companyId: finalTenantId,
        companyCode: finalTenantCode,
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
        imeiStatus,
        latitude: latitude !== undefined && latitude !== null ? Number(latitude) : (existing.latitude ?? null),
        longitude: longitude !== undefined && longitude !== null ? Number(longitude) : (existing.longitude ?? null),
        locationAccuracy: accuracy !== undefined && accuracy !== null ? Number(accuracy) : (existing.locationAccuracy ?? null),
        locationUpdatedAt: (latitude !== undefined && latitude !== null) ? new Date().toISOString() : (existing.locationUpdatedAt ?? null),
        locationAddress: address || existing.locationAddress || null
    };

    if (!existing.customerName && customerName && finalTenantId) {
        logAudit({
            companyId: finalTenantId,
            deviceId,
            eventType: 'DEVICE_CUSTOMER_BOUND',
            payload: { customer: customerName, phone: customerPhone, loanId, model: `${brand || ''} ${model || ''}`.trim() }
        });
    }

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

    logAudit({
        companyId: req.user.id,
        deviceId,
        eventType: 'DEVICE_COMMAND_' + command,
        req,
        payload: {
            command,
            customerName: target.customerName,
            customerPhone: target.customerPhone,
            loanId: target.loanId,
            model: `${target.brand || ''} ${target.model || ''}`.trim()
        }
    });

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

// REST: Upload & Set Remote Device Wallpaper
app.post('/api/devices/wallpaper', authMiddleware, async (req, res) => {
    try {
        const { deviceId, imageBase64, imageUrl, targetScreen, lockChanges } = req.body;
        
        let finalImageUrl = imageUrl;
        if (imageBase64) {
            const uploadsDir = path.join(__dirname, 'src', 'public', 'uploads', 'wallpapers');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
            const ext = matches ? (matches[1] === 'jpeg' ? 'jpg' : matches[1]) : 'jpg';
            const dataBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(imageBase64, 'base64');
            
            const filename = `wallpaper_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const filePath = path.join(uploadsDir, filename);
            fs.writeFileSync(filePath, dataBuffer);
            
            // Build absolute URL for the phone to download (must use reachable LAN IP, not localhost)
            const protocol = req.protocol || 'http';
            let reachableHost = req.get('host') || `${SERVER_HOST}:${PORT}`;
            if (reachableHost.includes('localhost') || reachableHost.includes('127.0.0.1')) {
                reachableHost = `${SERVER_HOST}:${PORT}`;
            }
            finalImageUrl = `${protocol}://${reachableHost}/uploads/wallpapers/${filename}`;
        }
        
        if (!finalImageUrl) {
            return res.status(400).json({ error: 'Please select an image file or provide a wallpaper URL.' });
        }

        // Ensure relative URLs (like /wallpapers/preset_minimal.jpg) have full protocol and reachable LAN host
        const protocol = req.protocol || 'http';
        let reachableHost = req.get('host') || `${SERVER_HOST}:${PORT}`;
        if (reachableHost.includes('localhost') || reachableHost.includes('127.0.0.1')) {
            reachableHost = `${SERVER_HOST}:${PORT}`;
        }

        if (finalImageUrl.startsWith('/')) {
            finalImageUrl = `${protocol}://${reachableHost}${finalImageUrl}`;
        } else if (finalImageUrl.includes('localhost:') || finalImageUrl.includes('127.0.0.1:')) {
            finalImageUrl = finalImageUrl.replace(/localhost:[0-9]+/g, `${SERVER_HOST}:${PORT}`).replace(/127\.0\.0\.1:[0-9]+/g, `${SERVER_HOST}:${PORT}`);
        }

        const tenantDevices = Object.values(connectedDevices).filter(d => d.tenantId === req.user.id);
        let dispatchedCount = 0;

        if (deviceId && deviceId !== 'all') {
            let target = connectedDevices[deviceId];
            if (!target) {
                // Also search by deviceId, id, hardwareImei, or enteredImei across tenant devices
                target = tenantDevices.find(d => 
                    d.deviceId === deviceId || 
                    d.id === deviceId || 
                    d.hardwareImei === deviceId || 
                    d.enteredImei === deviceId
                );
            }
            if (!target && tenantDevices.length === 1) {
                // If only 1 phone is enrolled, fallback to it gracefully
                target = tenantDevices[0];
            }
            if (!target) {
                return res.status(404).json({ error: 'Target device not found in your fleet.' });
            }
            if (target.socketId) {
                io.to(target.socketId).emit('server_command', {
                    command: 'SET_WALLPAPER',
                    wallpaperUrl: finalImageUrl,
                    target: targetScreen || 'both',
                    lockChanges: lockChanges !== false
                });
                dispatchedCount = 1;
            } else {
                return res.status(400).json({ error: `Device ${target.model || target.deviceId} is registered but currently offline (no active socket).` });
            }
        } else {
            tenantDevices.forEach(d => {
                if (d.socketId) {
                    io.to(d.socketId).emit('server_command', {
                        command: 'SET_WALLPAPER',
                        wallpaperUrl: finalImageUrl,
                        target: targetScreen || 'both',
                        lockChanges: lockChanges !== false
                    });
                    dispatchedCount++;
                }
            });
            if (dispatchedCount === 0 && tenantDevices.length > 0) {
                return res.status(400).json({ error: 'All devices in your fleet are currently offline.' });
            }
        }

        console.log(`[WALLPAPER DISPATCH] Shop ${req.user.shopName} dispatched wallpaper (${finalImageUrl}) to ${dispatchedCount} device(s).`);

        logAudit({
            companyId: req.user.id,
            deviceId: deviceId || 'ALL',
            eventType: 'WALLPAPER_PUSHED',
            req,
            payload: {
                wallpaperUrl: finalImageUrl,
                targetScreen,
                lockChanges,
                devicesAffected: dispatchedCount
            }
        });

        res.json({
            success: true,
            wallpaperUrl: finalImageUrl,
            dispatchedCount,
            message: `Wallpaper dispatched to ${dispatchedCount} active handset(s)!`
        });
    } catch (err) {
        console.error('[WALLPAPER DISPATCH ERROR]', err);
        res.status(500).json({ error: 'Failed to process wallpaper dispatch: ' + err.message });
    }
});

// REST: Restore Factory Default Wallpaper
app.post('/api/devices/wallpaper/clear', authMiddleware, (req, res) => {
    const { deviceId } = req.body;
    const tenantDevices = Object.values(connectedDevices).filter(d => d.tenantId === req.user.id);
    let dispatchedCount = 0;

    if (deviceId && deviceId !== 'all') {
        const target = connectedDevices[deviceId];
        if (target && target.socketId && target.tenantId === req.user.id) {
            io.to(target.socketId).emit('server_command', { command: 'CLEAR_WALLPAPER' });
            dispatchedCount = 1;
        }
    } else {
        tenantDevices.forEach(d => {
            if (d.socketId) {
                io.to(d.socketId).emit('server_command', { command: 'CLEAR_WALLPAPER' });
                dispatchedCount++;
            }
        });
    }

    console.log(`[WALLPAPER CLEAR] Shop ${req.user.shopName} cleared wallpaper on ${dispatchedCount} device(s).`);

    logAudit({
        companyId: req.user.id,
        deviceId: deviceId || 'ALL',
        eventType: 'WALLPAPER_RESTORED_DEFAULT',
        req,
        payload: { devicesAffected: dispatchedCount }
    });

    res.json({ success: true, message: `Default wallpaper restored on ${dispatchedCount} device(s).` });
});

// REST: Delete / Release Device (Removes all finance locks and automatically uninstalls app from phone)
app.delete('/api/devices/:deviceId', authMiddleware, async (req, res) => {
    const { deviceId } = req.params;
    const target = connectedDevices[deviceId];

    if (!target) {
        if (db.isPostgresConnected()) {
            try {
                const dbRes = await db.query('SELECT * FROM devices WHERE device_id = $1', [deviceId]);
                if (dbRes.rows.length === 0) {
                    return res.status(404).json({ error: 'Device not found.' });
                }
                if (dbRes.rows[0].tenant_id !== req.user.id) {
                    return res.status(403).json({ error: 'Unauthorized: This device does not belong to your shop account.' });
                }
                await db.query('DELETE FROM devices WHERE device_id = $1 AND tenant_id = $2', [deviceId, req.user.id]);
                emitTenantDeviceUpdate(req.user.id);
                return res.json({ success: true, message: 'Device deleted from database.' });
            } catch (e) {
                return res.status(500).json({ error: e.message });
            }
        }
        return res.status(404).json({ error: 'Device not found.' });
    }

    // STRICT MULTI-TENANT AUTHORIZATION CHECK
    if (target.tenantId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized: This device does not belong to your shop account.' });
    }

    console.log(`[RELEASE & DELETE] Shop ${req.user.shopName} (${req.user.tenantCode}) deleting device: ${deviceId}`);

    // 1. Send RELEASE_AND_UNINSTALL command to phone via Socket.IO
    if (target.socketId) {
        io.to(target.socketId).emit('server_command', {
            command: 'RELEASE_AND_UNINSTALL',
            timestamp: Date.now()
        });
        console.log(`[RELEASE DISPATCHED] RELEASE_AND_UNINSTALL emitted to socket: ${target.socketId}`);
    }

    // 2. Delete from PostgreSQL Database
    if (db.isPostgresConnected()) {
        try {
            await db.query('DELETE FROM devices WHERE device_id = $1 AND (tenant_id = $2 OR company_id = $2)', [deviceId, req.user.id]);
            await logAudit({
                companyId: req.user.id,
                deviceId,
                eventType: 'DEVICE_RELEASED_AND_UNENROLLED',
                req,
                payload: {
                    customerName: target.customerName,
                    customerPhone: target.customerPhone,
                    model: `${target.brand || ''} ${target.model || ''}`.trim()
                }
            });
            console.log(`[POSTGRESQL] Device ${deviceId} deleted from database.`);
        } catch (e) {
            console.error('[POSTGRESQL ERROR] Failed deleting device:', e.message);
        }
    }

    // 3. Remove from memory and save fleet state
    delete connectedDevices[deviceId];
    saveFleetState();

    // 4. Notify all tenant dashboard tabs
    emitTenantDeviceUpdate(req.user.id);

    res.json({
        success: true,
        message: 'Device release instruction dispatched. Hardware locks removed and app uninstalled.'
    });
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

    // Periodic heartbeat from phone with battery, status and GPS coordinates
    socket.on('heartbeat', ({ deviceId, battery, status, customerName, customerPhone, loanId, emiAmount, enteredImei, hardwareImei, latitude, longitude, accuracy }) => {
        if (connectedDevices[deviceId]) {
            if (battery !== undefined) connectedDevices[deviceId].battery = battery;
            if (status !== undefined) connectedDevices[deviceId].status = status;
            if (customerName) connectedDevices[deviceId].customerName = customerName;
            if (customerPhone) connectedDevices[deviceId].customerPhone = customerPhone;
            if (loanId) connectedDevices[deviceId].loanId = loanId;
            if (emiAmount) connectedDevices[deviceId].emiAmount = emiAmount;
            if (enteredImei) connectedDevices[deviceId].enteredImei = enteredImei;
            if (hardwareImei) connectedDevices[deviceId].hardwareImei = hardwareImei;
            if (latitude !== undefined && latitude !== null) {
                connectedDevices[deviceId].latitude = Number(latitude);
                connectedDevices[deviceId].longitude = Number(longitude);
                connectedDevices[deviceId].locationAccuracy = accuracy ? Number(accuracy) : null;
                connectedDevices[deviceId].locationUpdatedAt = new Date().toISOString();
            }
            connectedDevices[deviceId].online = true;
            connectedDevices[deviceId].socketId = socket.id;
            connectedDevices[deviceId].lastSeen = new Date().toLocaleTimeString();
            if (!connectedDevices[deviceId].tenantId && connectedDevices[deviceId].tenantCode === 'ALH-9565') {
                connectedDevices[deviceId].tenantId = 'tenant_1fa9abb03962dff6';
            }
            saveFleetState();
            if (connectedDevices[deviceId].tenantId) {
                emitTenantDeviceUpdate(connectedDevices[deviceId].tenantId);
            }
        }
    });

    // Dedicated high-precision location update event from device
    socket.on('device_location_updated', ({ deviceId, latitude, longitude, accuracy, address }) => {
        if (connectedDevices[deviceId]) {
            connectedDevices[deviceId].latitude = Number(latitude);
            connectedDevices[deviceId].longitude = Number(longitude);
            connectedDevices[deviceId].locationAccuracy = accuracy ? Number(accuracy) : null;
            connectedDevices[deviceId].locationUpdatedAt = new Date().toISOString();
            if (address) connectedDevices[deviceId].locationAddress = address;
            connectedDevices[deviceId].online = true;
            connectedDevices[deviceId].socketId = socket.id;
            connectedDevices[deviceId].lastSeen = new Date().toLocaleTimeString();
            saveFleetState();
            console.log(`[GPS LOCATION] Device ${deviceId} -> Lat: ${latitude}, Lng: ${longitude} (±${accuracy}m)`);
            if (connectedDevices[deviceId].tenantId) {
                emitTenantDeviceUpdate(connectedDevices[deviceId].tenantId);
            }
        }
    });

    // Dashboard requests instant on-demand GPS ping
    socket.on('request_device_location', ({ deviceId }) => {
        const dev = connectedDevices[deviceId];
        if (dev && dev.socketId) {
            console.log(`[GPS REQUEST] Sending GET_LOCATION to device ${deviceId}...`);
            io.to(dev.socketId).emit('server_command', { command: 'GET_LOCATION' });
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
                let rowTenantId = row.tenant_id;
                if (!rowTenantId && (row.tenant_code === 'ALH-9565' || !row.tenant_code)) {
                    rowTenantId = 'tenant_1fa9abb03962dff6';
                }
                if (!connectedDevices[row.device_id]) {
                    connectedDevices[row.device_id] = {
                        deviceId: row.device_id,
                        tenantId: rowTenantId,
                        tenantCode: row.tenant_code || 'ALH-9565',
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
                        apps: typeof row.apps === 'string' ? JSON.parse(row.apps) : (row.apps || []),
                        latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
                        longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
                        locationAccuracy: row.location_accuracy !== null && row.location_accuracy !== undefined ? Number(row.location_accuracy) : null,
                        locationUpdatedAt: row.location_updated_at ? new Date(row.location_updated_at).toISOString() : null,
                        locationAddress: row.location_address || null
                    };
                }
            }
            console.log(`[POSTGRESQL] Loaded ${res.rows.length} devices from PostgreSQL database.`);
        } catch (e) {
            console.warn('[POSTGRESQL WARNING] Failed loading devices:', e.message);
        }
    }
});
