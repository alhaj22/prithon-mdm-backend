const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const tenantsFilePath = path.join(dataDir, 'tenants.json');

let tenants = {};

// Load existing tenants from disk
function loadTenants() {
    if (fs.existsSync(tenantsFilePath)) {
        try {
            tenants = JSON.parse(fs.readFileSync(tenantsFilePath, 'utf8'));
        } catch (e) {
            console.error('Error loading tenants:', e);
            tenants = {};
        }
    }
}

// Persist tenants to disk atomically
function saveTenants() {
    try {
        const tmpPath = `${tenantsFilePath}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(tenants, null, 2));
        fs.renameSync(tmpPath, tenantsFilePath);
    } catch (e) {
        console.error('Error saving tenants:', e);
    }
}

loadTenants();

// Generate a unique 6-character uppercase tenant code, e.g. PR-9402
function generateTenantCode(shopName) {
    let prefix = 'PR';
    if (shopName) {
        const cleaned = shopName.replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (cleaned.length >= 2) prefix = cleaned.substring(0, 3);
    }
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomDigits}`;
}

async function createTenant({ shopName, ownerName, email, phone, password }) {
    loadTenants();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    for (const id in tenants) {
        if (tenants[id].email === normalizedEmail) {
            throw new Error('An account with this email already exists.');
        }
    }

    const tenantId = `tenant_${crypto.randomBytes(8).toString('hex')}`;
    let tenantCode = generateTenantCode(shopName);

    // Ensure tenantCode is unique
    let attempts = 0;
    while (Object.values(tenants).some(t => t.tenantCode === tenantCode) && attempts < 10) {
        tenantCode = generateTenantCode(shopName);
        attempts++;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newTenant = {
        id: tenantId,
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        email: normalizedEmail,
        phone: (phone || '').trim(),
        tenantCode,
        passwordHash,
        credits: 20, // Free credits for trial
        createdAt: new Date().toISOString()
    };

    tenants[tenantId] = newTenant;
    saveTenants();

    // Return sanitized object without passwordHash
    const { passwordHash: _, ...safeTenant } = newTenant;
    return safeTenant;
}

async function authenticateTenant(email, password) {
    loadTenants();
    const normalizedEmail = email.trim().toLowerCase();

    let tenant = null;
    for (const id in tenants) {
        if (tenants[id].email === normalizedEmail) {
            tenant = tenants[id];
            break;
        }
    }

    if (!tenant) {
        throw new Error('Invalid email or password.');
    }

    const isMatch = await bcrypt.compare(password, tenant.passwordHash);
    if (!isMatch) {
        throw new Error('Invalid email or password.');
    }

    const { passwordHash: _, ...safeTenant } = tenant;
    return safeTenant;
}

function findTenantById(tenantId) {
    loadTenants();
    const tenant = tenants[tenantId];
    if (!tenant) return null;
    const { passwordHash: _, ...safeTenant } = tenant;
    return safeTenant;
}

function findTenantByCode(tenantCode) {
    loadTenants();
    const normalized = (tenantCode || '').trim().toUpperCase();
    for (const id in tenants) {
        if (tenants[id].tenantCode === normalized) {
            const { passwordHash: _, ...safeTenant } = tenants[id];
            return safeTenant;
        }
    }
    return null;
}

module.exports = {
    createTenant,
    authenticateTenant,
    findTenantById,
    findTenantByCode
};
