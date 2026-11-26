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

function normalizeTenant(t) {
    if (!t) return null;
    const companyId = t.id || t.company_id || t.tenant_id;
    const companyName = t.company_name || t.company || t.shop_name || t.shopName || 'Enterprise Company';
    const companyCode = t.company_code || t.tenant_code || t.tenantCode || '';
    const userName = t.user_name || t.userName || t.owner_name || t.ownerName || '';
    const email = (t.email || '').trim().toLowerCase();
    const phone = t.phone || '';
    const city = t.city || '';
    const address = t.address || '';
    const credits = t.credits !== undefined ? t.credits : 20;
    const createdAt = t.createdAt || t.created_at || new Date().toISOString();

    return {
        id: companyId,
        companyId,
        tenantId: companyId,
        companyName,
        company: companyName,
        shopName: companyName,
        companyCode,
        tenantCode: companyCode,
        userName,
        ownerName: userName,
        email,
        phone,
        city,
        address,
        credits,
        createdAt
    };
}

async function createTenant({ shopName, ownerName, userName, email, phone, password, company, city, address }) {
    const normalizedEmail = email.trim().toLowerCase();
    const resolvedCompany = (company || shopName || '').trim();
    const resolvedUserName = (userName || ownerName || '').trim();
    const resolvedCity = (city || '').trim();
    const resolvedAddress = (address || '').trim();
    const resolvedPhone = (phone || '').trim();

    const tenantId = `tenant_${crypto.randomBytes(8).toString('hex')}`;
    let companyCode = generateTenantCode(resolvedCompany || resolvedUserName);

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
                INSERT INTO tenants (
                    id, shop_name, owner_name, email, phone, tenant_code, password_hash,
                    credits, company, user_name, city, address, company_name, company_code
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id, shop_name as "shopName", owner_name as "ownerName", company, company_name as "companyName",
                          user_name as "userName", email, phone, city, address, tenant_code as "tenantCode",
                          company_code as "companyCode", credits, created_at as "createdAt"
            `, [
                tenantId, resolvedCompany, resolvedUserName, normalizedEmail, resolvedPhone,
                companyCode, passwordHash, 20, resolvedCompany, resolvedUserName, resolvedCity,
                resolvedAddress, resolvedCompany, companyCode
            ]);

            const normalized = normalizeTenant(res.rows[0]);
            fallbackTenants[tenantId] = { ...normalized, passwordHash };
            saveFallbackTenants();
            return normalized;
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

    const safeTenant = normalizeTenant({
        id: tenantId,
        company_name: resolvedCompany,
        shop_name: resolvedCompany,
        company_code: companyCode,
        tenant_code: companyCode,
        user_name: resolvedUserName,
        owner_name: resolvedUserName,
        email: normalizedEmail,
        phone: resolvedPhone,
        city: resolvedCity,
        address: resolvedAddress,
        credits: 20,
        created_at: new Date().toISOString()
    });

    fallbackTenants[tenantId] = { ...safeTenant, passwordHash };
    saveFallbackTenants();
    return safeTenant;
}

async function authenticateTenant(email, password) {
    const normalizedEmail = email.trim().toLowerCase();

    if (db.isPostgresConnected()) {
        try {
            const res = await db.query(`
                SELECT id, shop_name as "shopName", owner_name as "ownerName", company, company_name as "companyName",
                       user_name as "userName", email, phone, city, address, tenant_code as "tenantCode",
                       company_code as "companyCode", password_hash as "passwordHash", credits, created_at as "createdAt"
                FROM tenants
                WHERE email = $1
            `, [normalizedEmail]);

            if (res.rows.length > 0) {
                const tenant = res.rows[0];
                const isMatch = await bcrypt.compare(password, tenant.passwordHash);
                if (!isMatch) throw new Error('Invalid email or password.');
                return normalizeTenant(tenant);
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

    return normalizeTenant(tenant);
}

async function findTenantById(tenantId) {
    if (db.isPostgresConnected()) {
        try {
            const res = await db.query(`
                SELECT id, shop_name as "shopName", owner_name as "ownerName", company, company_name as "companyName",
                       user_name as "userName", email, phone, city, address, tenant_code as "tenantCode",
                       company_code as "companyCode", credits, created_at as "createdAt"
                FROM tenants WHERE id = $1
            `, [tenantId]);
            if (res.rows.length > 0) {
                return normalizeTenant(res.rows[0]);
            }
        } catch (e) {}
    }

    loadFallbackTenants();
    const t = fallbackTenants[tenantId];
    if (!t) return null;
    return normalizeTenant(t);
}

async function findTenantByCode(tenantCode) {
    const normalized = (tenantCode || '').trim().toUpperCase();

    if (db.isPostgresConnected()) {
        try {
            const res = await db.query(`
                SELECT id, shop_name as "shopName", owner_name as "ownerName", company, company_name as "companyName",
                       user_name as "userName", email, phone, city, address, tenant_code as "tenantCode",
                       company_code as "companyCode", credits, created_at as "createdAt"
                FROM tenants WHERE UPPER(tenant_code) = $1 OR UPPER(company_code) = $1
            `, [normalized]);
            if (res.rows.length > 0) {
                return normalizeTenant(res.rows[0]);
            }
        } catch (e) {}
    }

    loadFallbackTenants();
    for (const id in fallbackTenants) {
        if (fallbackTenants[id].tenantCode === normalized || fallbackTenants[id].companyCode === normalized) {
            return normalizeTenant(fallbackTenants[id]);
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
