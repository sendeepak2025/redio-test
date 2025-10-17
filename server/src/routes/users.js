const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');
const AuthenticationService = require('../services/authentication-service');
const rbacController = require('../controllers/rbacController');

// Initialize services
const authService = new AuthenticationService();
const rbacService = rbacController.getRBACService();

/**
 * GET /api/users
 * Get all users (admin/user manager only)
 */
router.get('/', 
  authService.authenticationMiddleware(),
  rbacService.requireAnyPermission(['users:read', 'system:admin']),
  async (req, res) => {
    try {
      const { role, status, search } = req.query;
      
      // Build query
      let query = {};
      
      if (role) {
        query.roles = role;
      }
      
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
      
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }
      
      const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .lean();
      
      // Add last login info
      const usersWithActivity = users.map(user => ({
        ...user,
        lastLogin: user.lastLogin || null
      }));
      
      res.json({ 
        success: true, 
        data: usersWithActivity,
        total: usersWithActivity.length
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch users',
        error: error.message 
      });
    }
  }
);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id',
  authService.authenticationMiddleware(),
  rbacService.requireAnyPermission(['users:read', 'system:admin']),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
        .select('-password')
        .lean();
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      res.json({ success: true, data: user });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch user',
        error: error.message 
      });
    }
  }
);

/**
 * POST /api/users
 * Create new user
 */
router.post('/',
  authService.authenticationMiddleware(),
  rbacService.requireAnyPermission(['users:write', 'system:admin']),
  async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, roles, isActive } = req.body;
      
      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, email, and password are required' 
        });
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ username }, { email }] 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'User with this username or email already exists' 
        });
      }
      
      // Create user
      const user = new User({
        username,
        email,
        password, // Will be hashed by User model pre-save hook
        firstName: firstName || '',
        lastName: lastName || '',
        roles: roles || ['staff'],
        isActive: isActive !== undefined ? isActive : true
      });
      
      await user.save();
      
      // Return user without password
      const userResponse = user.toObject();
      delete userResponse.password;
      
      console.log('✅ User created:', { id: user._id, username: user.username });
      
      res.status(201).json({ 
        success: true, 
        data: userResponse,
        message: 'User created successfully'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Failed to create user',
        error: error.message 
      });
    }
  }
);

/**
 * PUT /api/users/:id
 * Update user
 */
router.put('/:id',
  authService.authenticationMiddleware(),
  rbacService.requireAnyPermission(['users:write', 'system:admin']),
  async (req, res) => {
    try {
      const { firstName, lastName, email, roles, isActive } = req.body;
      
      // Build update object
      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (roles !== undefined) updateData.roles = roles;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      console.log('✅ User updated:', { id: user._id, username: user.username });
      
      res.json({ 
        success: true, 
        data: user,
        message: 'User updated successfully'
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Failed to update user',
        error: error.message 
      });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Delete user (soft delete - set isActive to false)
 */
router.delete('/:id',
  authService.authenticationMiddleware(),
  rbacService.requireAnyPermission(['users:write', 'system:admin']),
  async (req, res) => {
    try {
      // Prevent self-deletion
      if (req.user && req.user.id === req.params.id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete your own account' 
        });
      }
      
      // Soft delete - just deactivate
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      console.log('✅ User deactivated:', { id: user._id, username: user.username });
      
      res.json({ 
        success: true, 
        message: 'User deactivated successfully',
        data: user
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to delete user',
        error: error.message 
      });
    }
  }
);

/**
 * POST /api/users/:id/activate
 * Reactivate a deactivated user
 */
router.post('/:id/activate',
  authService.authenticationMiddleware(),
  rbacService.requireAnyPermission(['users:write', 'system:admin']),
  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: true },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      console.log('✅ User activated:', { id: user._id, username: user.username });
      
      res.json({ 
        success: true, 
        message: 'User activated successfully',
        data: user
      });
    } catch (error) {
      console.error('Error activating user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to activate user',
        error: error.message 
      });
    }
  }
);

/**
 * PUT /api/users/:id/password
 * Change user password (admin only)
 */
router.put('/:id/password',
  authService.authenticationMiddleware(),
  rbacService.requirePermission('system:admin'),
  async (req, res) => {
    try {
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 6 characters' 
        });
      }
      
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      user.password = newPassword; // Will be hashed by pre-save hook
      await user.save();
      
      console.log('✅ User password changed:', { id: user._id, username: user.username });
      
      res.json({ 
        success: true, 
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to change password',
        error: error.message 
      });
    }
  }
);

module.exports = router;
