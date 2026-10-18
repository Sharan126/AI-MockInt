// ============================================
// authService.js - Authentication API Calls
// ============================================
// Reference: Axios POST/GET requests - reference-javascript.md
// ============================================

import API from './api.js';

const register = async (name, email, password) => {
  const response = await API.post('/auth/register', { name, email, password });
  return response.data.data;
};

const emailLogin = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data.data;
};

const getMe = async () => {
  const response = await API.get('/auth/me');
  return response.data.data;
};

const logout = async () => {
  const response = await API.post('/auth/logout');
  return response.data;
};

const forgotPassword = async (email) => {
  const response = await API.post('/auth/forgot-password', { email });
  return response.data.data;
};

const resetPassword = async (email, resetCode, newPassword) => {
  const response = await API.post('/auth/reset-password', {
    email,
    resetCode,
    newPassword,
  });
  return response.data.data;
};

const updateProfile = async ({ name, preferences }) => {
  const response = await API.put('/auth/profile', { name, preferences });
  return response.data.data;
};

const changePassword = async (currentPassword, newPassword) => {
  const response = await API.put('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data.data;
};

export {
  register,
  emailLogin,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};

