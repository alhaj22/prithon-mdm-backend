const jwt = require('jsonwebtoken');
const { findTenantById } = require('../models/tenantStore');

const JWT_SECRET = process.env.JWT_SECRET || 'prithon_enterprise_mdm_secret_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (JWT_SECRET + '_refresh_2026');

// Cookie security configurations (7 Days Access Token & 30 Days Refresh Token)
const COOKIE_OPTIONS_ACCESS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
};

const COOKIE_OPTIONS_REFRESH = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days
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
        { expiresIn: '7d' } // 7 Days
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
        { expiresIn: '30d' } // 30 Days
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
    // 1. Check Refresh Token from Cookies (30 days validity boundary)
    const refreshToken = req.cookies?.refreshToken || req.cookies?.refresh_token;
    if (!refreshToken) {
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const decodedRefresh = verifyRefreshToken(refreshToken);
    if (!decodedRefresh) {
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Session expired after 30 days. Please log in again.' });
    }

    const targetId = decodedRefresh.companyId || decodedRefresh.id || decodedRefresh.tenantId;
    const tenant = await findTenantById(targetId);
    if (!tenant) {
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Company account not found.' });
    }

    // 2. Check 7-day Access Token
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
    }

    // 3. Access Token expired/missing, but Refresh Token is valid -> Transparent silent refresh (issues new 7-day access token)
    const newAccessToken = generateAccessToken(tenant);
    res.cookie('accessToken', newAccessToken, COOKIE_OPTIONS_ACCESS);
    res.cookie('prithon_token', newAccessToken, COOKIE_OPTIONS_ACCESS);
    req.user = tenant;
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
