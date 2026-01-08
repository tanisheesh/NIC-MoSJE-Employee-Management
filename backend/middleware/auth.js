const jwt = require('jsonwebtoken');
const { User, Employee } = require('../models');
const { logUnauthorizedAccess, logSecurityEvent } = require('./auditLogger');

// Token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

// Account lockout tracking (in production, use Redis or database)
const accountLockouts = new Map();
const failedAttempts = new Map();

const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_ATTEMPTS = 5;

// Check if account is locked
const isAccountLocked = (userId) => {
  const lockoutInfo = accountLockouts.get(userId);
  if (!lockoutInfo) return false;
  
  if (Date.now() > lockoutInfo.lockedUntil) {
    accountLockouts.delete(userId);
    failedAttempts.delete(userId);
    return false;
  }
  
  return true;
};

// Lock account
const lockAccount = (userId, req) => {
  const lockedUntil = Date.now() + LOCKOUT_DURATION;
  accountLockouts.set(userId, { lockedUntil });
  
  logSecurityEvent(
    'ACCOUNT_LOCKED',
    userId,
    {
      reason: 'Too many failed authentication attempts',
      lockedUntil: new Date(lockedUntil).toISOString(),
      duration: LOCKOUT_DURATION / 1000 / 60 + ' minutes'
    },
    req
  );
};

// Track failed attempt
const trackFailedAttempt = (userId, req) => {
  const attempts = failedAttempts.get(userId) || 0;
  const newAttempts = attempts + 1;
  failedAttempts.set(userId, newAttempts);
  
  if (newAttempts >= MAX_FAILED_ATTEMPTS) {
    lockAccount(userId, req);
    return true; // Account is now locked
  }
  
  return false;
};

// Add token to blacklist
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

// Check if token is blacklisted
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logUnauthorizedAccess(null, 'authentication', 'missing_token', req);
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      logUnauthorizedAccess(null, 'authentication', 'blacklisted_token', req);
      return res.status(401).json({ error: 'Token has been revoked.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      logUnauthorizedAccess(null, 'authentication', 'invalid_token', req);
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // Check if account is locked
    if (isAccountLocked(decoded.id)) {
      const lockoutInfo = accountLockouts.get(decoded.id);
      const remainingTime = Math.ceil((lockoutInfo.lockedUntil - Date.now()) / 1000 / 60);
      
      logUnauthorizedAccess(decoded.id, 'authentication', 'account_locked', req);
      return res.status(423).json({ 
        error: `Account is locked. Try again in ${remainingTime} minutes.` 
      });
    }

    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Employee,
        as: 'profile'
      }]
    });
    
    if (!user) {
      logUnauthorizedAccess(decoded.id, 'authentication', 'user_not_found', req);
      return res.status(401).json({ error: 'User not found.' });
    }

    // Check if user account is active
    if (user.role === 'employee' && user.profile && user.profile.status !== 'active') {
      logUnauthorizedAccess(user.id, 'authentication', 'inactive_account', req);
      return res.status(401).json({ error: 'Account is inactive. Contact administrator.' });
    }

    // Clear failed attempts on successful authentication
    failedAttempts.delete(user.id);

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    logSecurityEvent('AUTH_ERROR', null, { error: error.message }, req);
    res.status(500).json({ error: 'Authentication service error.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
      } else {
        logUnauthorizedAccess(req.user?.id, 'admin_resource', 'insufficient_privileges', req);
        res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authorization service error.' });
  }
};

const superAdminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user && req.user.role === 'superadmin') {
        next();
      } else {
        logUnauthorizedAccess(req.user?.id, 'superadmin_resource', 'insufficient_privileges', req);
        res.status(403).json({ error: 'Access denied. Super admin privileges required.' });
      }
    });
  } catch (error) {
    console.error('Super admin auth error:', error);
    res.status(500).json({ error: 'Authorization service error.' });
  }
};

// Session management
const createSession = (userId, token) => {
  // In production, store in Redis or database
  const sessionId = require('crypto').randomBytes(32).toString('hex');
  const session = {
    userId,
    token,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    isActive: true
  };
  
  // Store session (implement your session storage here)
  return sessionId;
};

const validateSession = (sessionId) => {
  // Implement session validation logic
  // Check if session exists and is not expired
  return true;
};

const invalidateSession = (sessionId) => {
  // Implement session invalidation
  // Remove from storage
};

module.exports = { 
  auth, 
  adminAuth, 
  superAdminAuth,
  blacklistToken,
  isTokenBlacklisted,
  trackFailedAttempt,
  isAccountLocked,
  createSession,
  validateSession,
  invalidateSession
};