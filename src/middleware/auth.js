const jwt = require('jsonwebtoken');
const { findTenantById } = require('../models/tenantStore');

const JWT_SECRET = process.env.JWT_SECRET || 'prithon_enterprise_mdm_secret_key_2026';

function generateToken(tenant) {
    const companyId = tenant.id || tenant.companyId || tenant.tenantId;
    const companyName = tenant.companyName || tenant.company || tenant.shopName || 'Enterprise Workspace';
    const companyCode = tenant.companyCode || tenant.tenantCode || '';
    const userName = tenant.userName || tenant.ownerName || '';

    return jwt.sign(
        {
            id: companyId,
            companyId: companyId,
            tenantId: companyId,
            email: tenant.email,
            companyName: companyName,
            company: companyName,
            shopName: companyName,
            companyCode: companyCode,
            tenantCode: companyCode,
            userName: userName,
            ownerName: userName
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

async function authMiddleware(req, res, next) {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.prithon_token) {
        token = req.cookies.prithon_token;
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Authentication required. Please login.' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
    }

    const targetId = decoded.companyId || decoded.id || decoded.tenantId;
    const tenant = await findTenantById(targetId);
    if (!tenant) {
        return res.status(401).json({ error: 'Company account not found.' });
    }

    req.user = tenant;
    next();
}

module.exports = {
    JWT_SECRET,
    generateToken,
    verifyToken,
    authMiddleware
};
