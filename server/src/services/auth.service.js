// ============================================
// auth.service.js - Authentication Service
// ============================================
// Contains the business logic for:
//   - Email/password registration and login
//   - Getting user profile
// Reference: bcrypt.hash(), bcrypt.compare() - reference-backend.md
// ============================================

import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import { generateToken } from '../utils/jwt.utils.js';

/**
 * Register a new user with email and password.
 */
export const register = async (name, email, password) => {
  // Check if email already exists
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already registered.');
    error.statusCode = 409;
    throw error;
  }

  // Hash the password with bcrypt (10 salt rounds)
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user in the database
  const user = await User.create({ name, email, password: hashedPassword });

  // Generate a JWT token
  const token = generateToken(user);

  return {
    token,
    user: { id: user._id, email: user.email, name: user.name },
  };
};

/**
 * Login a user with email and password.
 */
export const emailLogin = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ email });
  if (!user || !user.password) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Compare the provided password with the stored hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Update last login time
  user.lastLogin = new Date();
  await user.save();

  // Generate a JWT token
  const token = generateToken(user);

  return {
    token,
    user: { id: user._id, email: user.email, name: user.name },
  };
};

/**
 * Get a user's profile by their ID.
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select('-__v -password');

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    authProvider: user.authProvider || 'local',
    preferences: user.preferences || {
      preferredRole: 'Full Stack Developer',
      difficulty: 'medium',
      codeLanguage: 'javascript',
      voiceSpeed: 'normal',
    },
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
};

/**
 * Generate password reset code for a user
 */
export const requestPasswordReset = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('No account found with this email address.');
    error.statusCode = 404;
    throw error;
  }

  if (user.authProvider !== 'local' && !user.password) {
    const error = new Error(
      `This account was created via ${user.authProvider}. Please log in using ${user.authProvider}.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Generate 6-digit verification code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordToken = resetCode;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  await user.save();

  return {
    message: 'Password reset code generated. Use this code to reset your password.',
    resetCode,
  };
};

/**
 * Reset password using verification code
 */
export const resetPasswordWithCode = async (email, resetCode, newPassword) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({
    email: normalizedEmail,
    resetPasswordToken: resetCode.trim(),
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    const error = new Error('Invalid or expired reset code. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  if (!newPassword || newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  // Hash new password
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.authProvider = 'local';
  await user.save();

  // Generate token so user can sign in immediately
  const token = generateToken(user);

  return {
    token,
    user: { id: user._id, email: user.email, name: user.name },
  };
};

/**
 * Update user profile and preferences
 */
export const updateUserProfile = async (userId, { name, preferences }) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (name && name.trim()) {
    user.name = name.trim();
  }

  if (preferences) {
    user.preferences = {
      ...user.preferences,
      ...preferences,
    };
  }

  await user.save();

  return {
    id: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    authProvider: user.authProvider,
    preferences: user.preferences,
  };
};

/**
 * Change password for logged in user
 */
export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.password) {
    const error = new Error(
      `This account uses ${user.authProvider} login and does not have a local password.`
    );
    error.statusCode = 400;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error('Current password is incorrect.');
    error.statusCode = 400;
    throw error;
  }

  if (!newPassword || newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: 'Password updated successfully' };
};

/**
 * Find or register user via social OAuth (Google or GitHub).
 */
export const socialLoginOrRegister = async ({
  email,
  name,
  provider,
  providerId,
  picture,
}) => {
  if (!email) {
    const error = new Error('No email address provided by OAuth provider.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Find user by email or providerId
  let user = await User.findOne({ email: normalizedEmail });

  if (user) {
    // Update social info if not already set
    if (!user.providerId && providerId) {
      user.providerId = providerId;
      user.authProvider = provider;
    }
    if (!user.picture && picture) {
      user.picture = picture;
    }
    user.lastLogin = new Date();
    await user.save();
  } else {
    // Create new OAuth user without password
    user = await User.create({
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      authProvider: provider,
      providerId: providerId || '',
      picture: picture || '',
      lastLogin: new Date(),
    });
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    },
  };
};
