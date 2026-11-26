const jwt = require('jsonwebtoken');
const { findTenantById } = require('../models/tenantStore');

const JWT_SECRET = process.env.JWT_SECRET || 'prithon_enterprise_mdm_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (JWT_SECRET + '_refresh_2026');

// Cookie security configurations (Set to 1 min Access Token & 2 min Refresh Token for testing)
const COOKIE_OPTIONS_ACCESS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 1 * 60 * 1000 // 1 minute (60 seconds)
};

const COOKIE_OPTIONS_REFRESH = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 1000 // 2 minutes (120 seconds)
};

function generateAccessToken(tenant) {
    const companyId = tenant.id || tenant.companyId || tenant.tenantId;
    const companyName = tenant.companyName || tenant.company || tenant.shopName || 'Enterprise Workspace';
    const companyCode = tenant.companyCode || tenant.tenantCode || '';
    const userName = tenant.userName || tenant.ownerName || '';

    return jwt.sign(
        {
            id: companyId,
            companyId,
            tenantId: companyId,
            email: tenant.email,
            companyName,
            company: companyName,
            shopName: companyName,
            companyCode,
            tenantCode: companyCode,
            userName,
            ownerName: userName,
            tokenType: 'access'
        },
        JWT_SECRET,
        { expiresIn: '1m' } // 1 minute
    );
}

function generateRefreshToken(tenant) {
    const companyId = tenant.id || tenant.companyId || tenant.tenantId;
    return jwt.sign(
        {
            id: companyId,
            companyId,
            tenantId: companyId,
            email: tenant.email,
            tokenType: 'refresh'
        },
        JWT_REFRESH_SECRET,
        { expiresIn: '2m' } // 2 minutes
    );
}

function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (e) {
        return null;
    }
}

// Backward compatibility alias
function generateToken(tenant) {
    return generateAccessToken(tenant);
}

function verifyToken(token) {
    return verifyAccessToken(token) || verifyRefreshToken(token);
}

function setAuthCookies(res, tenant) {
    const accessToken = generateAccessToken(tenant);
    const refreshToken = generateRefreshToken(tenant);

    res.cookie('accessToken', accessToken, COOKIE_OPTIONS_ACCESS);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS_REFRESH);
    // Legacy fallback cookie
    res.cookie('prithon_token', accessToken, COOKIE_OPTIONS_ACCESS);

    return { accessToken, refreshToken };
}

function clearAuthCookies(res) {
    const clearOpts = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    };
    res.clearCookie('accessToken', clearOpts);
    res.clearCookie('refreshToken', clearOpts);
    res.clearCookie('prithon_token', clearOpts);
}

async function authMiddleware(req, res, next) {
    // 1. Strict 2-minute session boundary: Refresh Token MUST be present and valid
    const refreshToken = req.cookies?.refreshToken || req.cookies?.refresh_token;
    if (!refreshToken) {
        console.log('[AUTH DEBUG] No refresh token in cookies. Terminating session.');
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const decodedRefresh = verifyRefreshToken(refreshToken);
    if (!decodedRefresh) {
        console.log('[AUTH DEBUG] Refresh Token expired (2m lifetime reached). Auto logout triggered!');
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Session expired after 2 minutes. Please log in again.' });
    }

    const targetId = decodedRefresh.companyId || decodedRefresh.id || decodedRefresh.tenantId;
    const tenant = await findTenantById(targetId);
    if (!tenant) {
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Company account not found.' });
    }

    // 2. Check 1-minute Access Token
    let accessToken = req.cookies?.accessToken || req.cookies?.access_token;
    if (!accessToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        accessToken = req.headers.authorization.split(' ')[1];
    }

    if (accessToken) {
        const decodedAccess = verifyAccessToken(accessToken);
        if (decodedAccess) {
            req.user = tenant;
            return next();
        }
        console.log('[AUTH DEBUG] Access Token expired (1m reached). Silently refreshing using valid Refresh Token...');
    }

    // 3. Access Token expired/missing, but Refresh Token is valid -> Silent refresh
    const newAccessToken = generateAccessToken(tenant);
    res.cookie('accessToken', newAccessToken, COOKIE_OPTIONS_ACCESS);
    res.cookie('prithon_token', newAccessToken, COOKIE_OPTIONS_ACCESS);
    req.user = tenant;
    console.log(`[AUTH DEBUG] Silently refreshed 1m Access Token for: ${tenant.companyName || tenant.email}`);
    return next();
}

module.exports = {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateToken,
    verifyToken,
    setAuthCookies,
    clearAuthCookies,
    COOKIE_OPTIONS_ACCESS,
    COOKIE_OPTIONS_REFRESH,
    authMiddleware
};
