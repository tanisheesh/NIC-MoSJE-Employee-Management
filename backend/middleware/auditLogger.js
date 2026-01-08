const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Audit log levels
const LOG_LEVELS = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SECURITY: 'SECURITY',
  ACCESS: 'ACCESS'
};

// Log entry structure
const createLogEntry = (level, action, userId, details, req) => {
  return {
    timestamp: new Date().toISOString(),
    level,
    action,
    userId: userId || 'anonymous',
    userAgent: req?.get('User-Agent') || 'unknown',
    ip: req?.ip || req?.connection?.remoteAddress || 'unknown',
    method: req?.method || 'unknown',
    url: req?.originalUrl || 'unknown',
    details: details || {},
    sessionId: req?.sessionID || 'no-session'
  };
};

// Write log to file
const writeLog = (logEntry, logType = 'audit') => {
  const logFile = path.join(logsDir, `${logType}-${new Date().toISOString().split('T')[0]}.log`);
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error('Failed to write audit log:', err);
    }
  });
};

// Audit logging middleware
const auditLogger = (action, level = LOG_LEVELS.INFO) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const logEntry = createLogEntry(
        level,
        action,
        req.user?.id,
        {
          statusCode: res.statusCode,
          responseSize: data ? data.length : 0,
          requestBody: req.method === 'POST' || req.method === 'PUT' ? 
            sanitizeLogData(req.body) : undefined
        },
        req
      );
      
      writeLog(logEntry);
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Security event logger
const logSecurityEvent = (event, userId, details, req, level = LOG_LEVELS.SECURITY) => {
  const logEntry = createLogEntry(level, event, userId, details, req);
  writeLog(logEntry, 'security');
};

// Access logger for sensitive operations
const logAccess = (resource, action, userId, details, req) => {
  const logEntry = createLogEntry(LOG_LEVELS.ACCESS, `${action}_${resource}`, userId, details, req);
  writeLog(logEntry, 'access');
};

// Data access logger for documents
const logDocumentAccess = (documentId, action, userId, req) => {
  logAccess('document', action, userId, { documentId }, req);
};

// Employee data access logger
const logEmployeeAccess = (employeeId, action, userId, req) => {
  logAccess('employee', action, userId, { employeeId }, req);
};

// Sanitize sensitive data from logs
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'newPassword', 'currentPassword', 'token', 'secret'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Failed login attempt logger
const logFailedLogin = (emailOrUsername, reason, req) => {
  logSecurityEvent(
    'FAILED_LOGIN',
    null,
    {
      emailOrUsername: emailOrUsername,
      reason: reason,
      timestamp: new Date().toISOString()
    },
    req,
    LOG_LEVELS.WARNING
  );
};

// Successful login logger
const logSuccessfulLogin = (userId, req) => {
  logSecurityEvent(
    'SUCCESSFUL_LOGIN',
    userId,
    {
      timestamp: new Date().toISOString()
    },
    req,
    LOG_LEVELS.INFO
  );
};

// Password change logger
const logPasswordChange = (userId, req) => {
  logSecurityEvent(
    'PASSWORD_CHANGED',
    userId,
    {
      timestamp: new Date().toISOString()
    },
    req,
    LOG_LEVELS.SECURITY
  );
};

// Account lockout logger
const logAccountLockout = (userId, reason, req) => {
  logSecurityEvent(
    'ACCOUNT_LOCKED',
    userId,
    {
      reason: reason,
      timestamp: new Date().toISOString()
    },
    req,
    LOG_LEVELS.SECURITY
  );
};

// File upload logger
const logFileUpload = (userId, fileName, fileSize, documentType, req) => {
  logAccess(
    'file',
    'upload',
    userId,
    {
      fileName: fileName,
      fileSize: fileSize,
      documentType: documentType,
      timestamp: new Date().toISOString()
    },
    req
  );
};

// Unauthorized access attempt logger
const logUnauthorizedAccess = (userId, resource, action, req) => {
  logSecurityEvent(
    'UNAUTHORIZED_ACCESS',
    userId,
    {
      resource: resource,
      action: action,
      timestamp: new Date().toISOString()
    },
    req,
    LOG_LEVELS.WARNING
  );
};

module.exports = {
  auditLogger,
  logSecurityEvent,
  logAccess,
  logDocumentAccess,
  logEmployeeAccess,
  logFailedLogin,
  logSuccessfulLogin,
  logPasswordChange,
  logAccountLockout,
  logFileUpload,
  logUnauthorizedAccess,
  LOG_LEVELS
};