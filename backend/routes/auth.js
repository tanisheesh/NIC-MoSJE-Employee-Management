const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { body } = require('express-validator');
const { User, Employee } = require('../models');
const { auth, trackFailedAttempt, blacklistToken } = require('../middleware/auth');
const { validatePassword, checkPasswordHistory } = require('../utils/passwordValidation');
const { 
  loginLimiter, 
  passwordResetLimiter, 
  validateInput, 
  validationRules 
} = require('../middleware/security');
const { 
  logFailedLogin, 
  logSuccessfulLogin, 
  logPasswordChange,
  logSecurityEvent 
} = require('../middleware/auditLogger');

const router = express.Router();

// Login with enhanced security
router.post('/login', 
  loginLimiter,
  validateInput([
    body('emailOrUsername')
      .notEmpty()
      .withMessage('Email or username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ]),
  async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;

      if (!emailOrUsername || !password) {
        return res.status(400).json({ 
          error: 'Email/username and password are required' 
        });
      }

      // Try to find user by email or username
      const user = await User.findOne({ 
        where: { 
          [Op.or]: [
            { email: emailOrUsername },
            { username: emailOrUsername }
          ]
        },
        include: [{
          model: Employee,
          as: 'profile'
        }]
      });

      if (!user) {
        logFailedLogin(emailOrUsername, 'user_not_found', req);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        const remainingTime = Math.ceil((user.accountLockedUntil - new Date()) / 1000 / 60);
        logFailedLogin(emailOrUsername, 'account_locked', req);
        return res.status(423).json({ 
          error: `Account is locked. Try again in ${remainingTime} minutes.` 
        });
      }

      // Check if account is active
      if (!user.isActive) {
        logFailedLogin(emailOrUsername, 'account_inactive', req);
        return res.status(401).json({ error: 'Account is inactive. Contact administrator.' });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        await user.incrementFailedAttempts();
        logFailedLogin(emailOrUsername, 'invalid_password', req);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if employee is active (only for non-admin users)
      if (user.role === 'employee' && user.profile && user.profile.status !== 'active') {
        logFailedLogin(emailOrUsername, 'employee_inactive', req);
        return res.status(401).json({ error: 'Account is inactive. Please contact administrator.' });
      }

      // Reset failed attempts on successful login
      await user.resetFailedAttempts();

      // Generate JWT token with shorter expiration
      const token = jwt.sign(
        { 
          id: user.id, 
          role: user.role,
          iat: Math.floor(Date.now() / 1000)
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Reduced from 7 days to 1 hour
      );

      // Log successful login
      logSuccessfulLogin(user.id, req);

      res.json({
        token,
        refreshToken: jwt.sign(
          { id: user.id, type: 'refresh' },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        ),
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      logSecurityEvent('LOGIN_ERROR', null, { error: error.message }, req);
      res.status(500).json({ error: 'Authentication service error' });
    }
  }
);

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout with token blacklisting
router.post('/logout', auth, async (req, res) => {
  try {
    // Add token to blacklist
    blacklistToken(req.token);
    
    logSecurityEvent('LOGOUT', req.user.id, {}, req);
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout service error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        username: req.user.username,
        role: req.user.role,
        profile: req.user.profile,
        lastLogin: req.user.lastLogin,
        passwordChangedAt: req.user.passwordChangedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'User service error' });
  }
});

// Change password with enhanced security
router.put('/change-password', 
  auth,
  passwordResetLimiter,
  validateInput([
    validationRules.password.withMessage('Current password is required').bail(),
    validationRules.password.withMessage('New password must meet security requirements')
  ]),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Employee,
          as: 'profile'
        }]
      });

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        logSecurityEvent('INVALID_PASSWORD_CHANGE', user.id, {}, req);
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Check if new password is same as current
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({ 
          error: 'New password must be different from current password' 
        });
      }

      // Validate new password
      const personalInfo = {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        email: user.email,
        username: user.username,
        phone: user.profile?.phone
      };

      const passwordValidation = validatePassword(newPassword, personalInfo);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        });
      }

      // Check password history
      if (!checkPasswordHistory(user.id, newPassword)) {
        return res.status(400).json({ 
          error: 'Password was recently used. Please choose a different password.' 
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Log password change
      logPasswordChange(user.id, req);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Password service error' });
    }
  }
);

// Update profile (Admin only) with enhanced validation
router.put('/profile', 
  auth, 
  validateInput([
    validationRules.name.optional(),
    validationRules.email.optional(),
    validationRules.username.optional()
  ]),
  async (req, res) => {
    try {
      const { firstName, lastName, email, username } = req.body;

      // Only allow admin users to update their profile through this route
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if email already exists (excluding current user)
      if (email && email !== req.user.email) {
        const existingEmail = await User.findOne({
          where: { 
            email: email,
            id: { [Op.ne]: req.user.id }
          }
        });
        if (existingEmail) {
          return res.status(400).json({ error: 'Email is already registered' });
        }
      }

      // Check if username already exists (excluding current user)
      if (username && username !== req.user.username) {
        const existingUsername = await User.findOne({
          where: { 
            username: username,
            id: { [Op.ne]: req.user.id }
          }
        });
        if (existingUsername) {
          return res.status(400).json({ error: 'Username is already taken' });
        }
      }

      // Update user account
      const user = await User.findByPk(req.user.id);
      if (email) user.email = email;
      if (username) user.username = username;
      await user.save();

      // Update employee profile if exists
      const employee = await Employee.findOne({ where: { userId: req.user.id } });
      if (employee) {
        if (firstName) employee.firstName = firstName;
        if (lastName) employee.lastName = lastName;
        if (email) employee.email = email;
        if (username) employee.username = username;
        await employee.save();
      }

      logSecurityEvent('PROFILE_UPDATED', req.user.id, { 
        updatedFields: Object.keys(req.body) 
      }, req);

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Profile service error' });
    }
  }
);

module.exports = router;