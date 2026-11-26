const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db/db');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const tenantsFilePath = path.join(dataDir, 'tenants.json');
let fallbackTenants = {};

function loadFallbackTenants() {
    if (fs.existsSync(tenantsFilePath)) {
        try {
            fallbackTenants = JSON.parse(fs.readFileSync(tenantsFilePath, 'utf8'));
        } catch (e) {
            fallbackTenants = {};
        }
    }
}

function saveFallbackTenants() {
    try {
        const tmpPath = `${tenantsFilePath}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(fallbackTenants, null, 2));
        fs.renameSync(tmpPath, tenantsFilePath);
    } catch (e) {}
}

loadFallbackTenants();

function generateTenantCode(shopName) {
    let prefix = 'PR';
    if (shopName) {
        const cleaned = shopName.replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (cleaned.length >= 2) prefix = cleaned.substring(0, 3);
    }
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomDigits}`;
}

async function createTenant({ shopName, ownerName, userName, email, phone, password, company, city, address }) {
    const normalizedEmail = email.trim().toLowerCase();
    const resolvedCompany = (company || shopName || '').trim();
    const resolvedUserName = (userName || ownerName || '').trim();
    const resolvedCity = (city || '').trim();
    const resolvedAddress = (address || '').trim();
    const resolvedPhone = (phone || '').trim();

    const tenantId = `tenant_${crypto.randomBytes(8).toString('hex')}`;
    let tenantCode = generateTenantCode(resolvedCompany || resolvedUserName);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (db.isPostgresConnected()) {
        try {
            // Check if email already exists
            const check = await db.query('SELECT id FROM tenants WHERE email = $1', [normalizedEmail]);
            if (check.rows.length > 0) {
                throw new Error('An account with this email already exists.');
            }

            const res = await db.query(`
                INSERT INTO tenants (id, shop_name, owner_name, email, phone, tenant_code, password_hash, credits, company, user_name, city, address)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING id, shop_name as "shopName", owner_name as "ownerName", company, user_name as "userName", email, phone, city, address, tenant_code as "tenantCode", credits, created_at as "createdAt"
            `, [tenantId, resolvedCompany, resolvedUserName, normalizedEmail, resolvedPhone, tenantCode, passwordHash, 20, resolvedCompany, resolvedUserName, resolvedCity, resolvedAddress]);

            const row = res.rows[0];
            row.shopName = row.company || row.shopName;
            row.ownerName = row.userName || row.ownerName;
            row.userName = row.userName || row.ownerName;
            row.company = row.company || row.shopName;

            // Also keep fallback updated
            fallbackTenants[tenantId] = { ...row, passwordHash };
            saveFallbackTenants();

            return row;
        } catch (err) {
            if (err.message.includes('already exists')) throw err;
            console.warn('[POSTGRES] createTenant fallback to local store:', err.message);
        }
    }

    // Fallback store
    loadFallbackTenants();
    for (const id in fallbackTenants) {
        if (fallbackTenants[id].email === normalizedEmail) {
            throw new Error('An account with this email already exists.');
        }
    }

    const safeTenant = {
        id: tenantId,
        shopName: resolvedCompany,
        ownerName: resolvedUserName,
        company: resolvedCompany,
        userName: resolvedUserName,
        email: normalizedEmail,
        phone: resolvedPhone,
        city: resolvedCity,
        address: resolvedAddress,
        tenantCode,
        credits: 20,
        createdAt: new Date().toISOString()
    };

    fallbackTenants[tenantId] = { ...safeTenant, passwordHash };
    saveFallbackTenants();
    return safeTenant;
}

async function authenticateTenant(email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    if (db.isPostgresConnected()) {
        try {
            const res = await db.query(`
                SELECT id, shop_name as "shopName", owner_name as "ownerName", company, user_name as "userName", email, phone, city, address, tenant_code as "tenantCode", password_hash as "passwordHash", credits, created_at as "createdAt"
                FROM tenants
                WHERE email = $1
            `, [normalizedEmail]);

            if (res.rows.length > 0) {
                const tenant = res.rows[0];
                const isMatch = await bcrypt.compare(password, tenant.passwordHash);
                if (!isMatch) throw new Error('Invalid email or password.');
                const { passwordHash: _, ...safeTenant } = tenant;
                safeTenant.shopName = safeTenant.company || safeTenant.shopName;
                safeTenant.ownerName = safeTenant.userName || safeTenant.ownerName;
                safeTenant.userName = safeTenant.userName || safeTenant.ownerName;
                safeTenant.company = safeTenant.company || safeTenant.shopName;
                return safeTenant;
            }
        } catch (err) {
            if (err.message === 'Invalid email or password.') throw err;
            console.warn('[POSTGRES] authenticateTenant fallback:', err.message);
        }
    }

    // Fallback store
    loadFallbackTenants();
    let tenant = null;
    for (const id in fallbackTenants) {
        if (fallbackTenants[id].email === normalizedEmail) {
            tenant = fallbackTenants[id];
            break;
        }
    }

    if (!tenant) throw new Error('Invalid email or password.');
    const isMatch = await bcrypt.compare(password, tenant.passwordHash);
    if (!isMatch) throw new Error('Invalid email or password.');

    const { passwordHash: _, ...safeTenant } = tenant;
    safeTenant.shopName = safeTenant.company || safeTenant.shopName;
    safeTenant.ownerName = safeTenant.userName || safeTenant.ownerName;
    safeTenant.userName = safeTenant.userName || safeTenant.ownerName;
    safeTenant.company = safeTenant.company || safeTenant.shopName;
    return safeTenant;
}

async function findTenantById(tenantId) {
    if (db.isPostgresConnected()) {
        try {
            const res = await db.query(`
                SELECT id, shop_name as "shopName", owner_name as "ownerName", company, user_name as "userName", email, phone, city, address, tenant_code as "tenantCode", credits, created_at as "createdAt"
                FROM tenants WHERE id = $1
            `, [tenantId]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                row.shopName = row.company || row.shopName;
                row.ownerName = row.userName || row.ownerName;
                row.userName = row.userName || row.ownerName;
                row.company = row.company || row.shopName;
                return row;
            }
        } catch (e) {}
    }

    loadFallbackTenants();
    const t = fallbackTenants[tenantId];
    if (!t) return null;
    const { passwordHash: _, ...safeTenant } = t;
    safeTenant.shopName = safeTenant.company || safeTenant.shopName;
    safeTenant.ownerName = safeTenant.userName || safeTenant.ownerName;
    safeTenant.userName = safeTenant.userName || safeTenant.ownerName;
    safeTenant.company = safeTenant.company || safeTenant.shopName;
    return safeTenant;
}

async function findTenantByCode(tenantCode) {
    const normalized = (tenantCode || '').trim().toUpperCase();

    if (db.isPostgresConnected()) {
        try {
            const res = await db.query(`
                SELECT id, shop_name as "shopName", owner_name as "ownerName", company, user_name as "userName", email, phone, city, address, tenant_code as "tenantCode", credits, created_at as "createdAt"
                FROM tenants WHERE UPPER(tenant_code) = $1
            `, [normalized]);
            if (res.rows.length > 0) {
                const row = res.rows[0];
                row.shopName = row.company || row.shopName;
                row.ownerName = row.userName || row.ownerName;
                row.userName = row.userName || row.ownerName;
                row.company = row.company || row.shopName;
                return row;
            }
        } catch (e) {}
    }

    loadFallbackTenants();
    for (const id in fallbackTenants) {
        if (fallbackTenants[id].tenantCode === normalized) {
            const { passwordHash: _, ...safeTenant } = fallbackTenants[id];
            safeTenant.shopName = safeTenant.company || safeTenant.shopName;
            safeTenant.ownerName = safeTenant.userName || safeTenant.ownerName;
            safeTenant.userName = safeTenant.userName || safeTenant.ownerName;
            safeTenant.company = safeTenant.company || safeTenant.shopName;
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
