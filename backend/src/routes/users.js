const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const UserResponseDTO = require('../dto/response/UserResponseDTO');
const BaseResponseDTO = require('../dto/response/BaseResponseDTO');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'refreshToken'] },
      where: { isActive: true }
    });
    
    const userResponses = users.map(user => new UserResponseDTO(user));
    res.json(BaseResponseDTO.success(userResponses, 'Users retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });
    
    if (!user || !user.isActive) {
      return res.status(404).json(BaseResponseDTO.error('User not found'));
    }
    
    const userResponse = new UserResponseDTO(user);
    res.json(BaseResponseDTO.success(userResponse, 'User retrieved successfully'));
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const { firstName, lastName, email, role, isActive } = req.body;
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json(BaseResponseDTO.error('User not found'));
    }
    
    // Update user
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      email: email || user.email,
      role: role || user.role,
      isActive: isActive !== undefined ? isActive : user.isActive
    });
    
    const userResponse = new UserResponseDTO(user);
    res.json(BaseResponseDTO.success(userResponse, 'User updated successfully'));
  } catch (error) {
    next(error);
  }
});

// Delete user (soft delete - admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json(BaseResponseDTO.error('User not found'));
    }
    
    await user.update({ isActive: false });
    res.json(BaseResponseDTO.success(null, 'User deleted successfully'));
  } catch (error) {
    next(error);
  }
});

module.exports = router;