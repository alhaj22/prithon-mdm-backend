require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/prithon_mdm';

let pool = null;
let isConnected = false;

function initPool() {
    try {
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1') 
                ? false 
                : { rejectUnauthorized: false },
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
        });

        pool.on('error', (err) => {
            console.error('[POSTGRESQL] Unexpected error on idle client:', err.message);
        });
    } catch (e) {
        console.error('[POSTGRESQL] Failed to initialize connection pool:', e.message);
    }
}

initPool();

async function initDatabase() {
    if (!pool) return false;
    try {
        const client = await pool.connect();
        isConnected = true;
        console.log('[POSTGRESQL] Successfully connected to PostgreSQL Database engine.');

        // 1. Create Tenants Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS tenants (
                id VARCHAR(64) PRIMARY KEY,
                shop_name VARCHAR(255) NOT NULL,
                owner_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(32),
                tenant_code VARCHAR(16) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                credits INT DEFAULT 20,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_tenants_code ON tenants(tenant_code);
            CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);

            -- Auto-migration: Enterprise Profile & Company Columns
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city VARCHAR(128);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company VARCHAR(255);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
            ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_code VARCHAR(16);
            CREATE INDEX IF NOT EXISTS idx_tenants_company_code ON tenants(company_code);
        `);

        // 2. Create Devices Table (with JSONB support for apps inventory & telemetry)
        await client.query(`
            CREATE TABLE IF NOT EXISTS devices (
                device_id VARCHAR(64) PRIMARY KEY,
                tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
                tenant_code VARCHAR(16),
                brand VARCHAR(64),
                model VARCHAR(64),
                battery INT DEFAULT 100,
                android_version VARCHAR(32),
                status VARCHAR(32) DEFAULT 'NORMAL',
                online BOOLEAN DEFAULT FALSE,
                ip VARCHAR(64),
                last_seen VARCHAR(64),
                is_device_owner BOOLEAN DEFAULT FALSE,
                customer_name VARCHAR(255),
                customer_phone VARCHAR(32),
                loan_id VARCHAR(64),
                emi_amount VARCHAR(32),
                due_date VARCHAR(32),
                entered_imei VARCHAR(32),
                hardware_imei VARCHAR(32),
                imei_verified BOOLEAN DEFAULT FALSE,
                imei_status VARCHAR(32) DEFAULT 'PENDING',
                apps JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_devices_tenant_id ON devices(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_devices_entered_imei ON devices(entered_imei);

            -- Auto-migration: Location tracking & Company isolation columns
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS location_accuracy REAL;
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ;
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS location_address TEXT;
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS company_id VARCHAR(64);
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS company_code VARCHAR(16);
            ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_app_hidden BOOLEAN DEFAULT FALSE;
            CREATE INDEX IF NOT EXISTS idx_devices_company_id ON devices(company_id);
            CREATE INDEX IF NOT EXISTS idx_devices_company_code ON devices(company_code);
        `);

        // 3. Create Audit Logs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGSERIAL PRIMARY KEY,
                tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
                company_id VARCHAR(64),
                device_id VARCHAR(64),
                event_type VARCHAR(64) NOT NULL,
                ip_address VARCHAR(64),
                payload JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON audit_logs(tenant_id);
            CREATE INDEX IF NOT EXISTS idx_audit_company_id ON audit_logs(company_id);
            CREATE INDEX IF NOT EXISTS idx_audit_device_id ON audit_logs(device_id);
            CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
        `);

        client.release();
        console.log('[POSTGRESQL] Core Schemas verified (tenants, devices, audit_logs).');
        return true;
    } catch (err) {
        console.warn(`[POSTGRESQL WARNING] Could not connect to PostgreSQL at ${DATABASE_URL}: ${err.message}`);
        console.warn('[POSTGRESQL WARNING] Automatic fallback to Atomic JSON Store is active.');
        isConnected = false;
        return false;
    }
}

async function query(text, params) {
    if (!pool || !isConnected) {
        throw new Error('PostgreSQL is not connected.');
    }
    return pool.query(text, params);
}

module.exports = {
    pool,
    initDatabase,
    query,
    isPostgresConnected: () => isConnected
};
