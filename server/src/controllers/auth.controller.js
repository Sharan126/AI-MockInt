// ============================================
// auth.controller.js - Auth Controller
// ============================================
// Handles HTTP requests for authentication.
// Flow: Route → Controller → Service → Database
// Reference: req.body, res.json(), res.status() - reference-backend.md
// ============================================

import * as authService from '../services/auth.service.js';

/**
 * POST /api/auth/register
 * Register with email and password.
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const result = await authService.register(name, email, password);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Login with email and password.
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await authService.emailLogin(email, password);
    return res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, message: error.message });
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Get the current logged-in user's profile.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    return res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Logout user (frontend deletes the token).
 */
export const logout = (req, res) => {
  return res.json({ success: true, data: { message: 'Logged out successfully' } });
};

const getClientUrl = (req) => {
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '');
  }
  return req.headers.referer
    ? new URL(req.headers.referer).origin
    : 'http://localhost:5173';
};

const getBackendUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.trim().replace(/\/$/, '');
  }
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${protocol}://${host}`;
};

/**
 * GET /api/auth/google
 * Redirect to Google OAuth consent screen
 */
export const googleAuthRedirect = (req, res) => {
  const clientUrl = getClientUrl(req);
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return res.redirect(
      `${clientUrl}/login?oauth_error=${encodeURIComponent(
        'Google Client ID is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env'
      )}`
    );
  }

  const backendUrl = getBackendUrl(req);
  const redirectUri = `${backendUrl}/api/auth/google/callback`;
  const scope = encodeURIComponent('openid profile email');
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;

  return res.redirect(googleAuthUrl);
};

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
export const googleAuthCallback = async (req, res) => {
  const clientUrl = getClientUrl(req);
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(
      `${clientUrl}/login?oauth_error=${encodeURIComponent(
        error || 'Google authentication was cancelled'
      )}`
    );
  }

  try {
    const backendUrl = getBackendUrl(req);
    const redirectUri = `${backendUrl}/api/auth/google/callback`;

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange Google OAuth code');
    }

    // Fetch user profile from Google
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userinfo = await userinfoResponse.json();

    const result = await authService.socialLoginOrRegister({
      email: userinfo.email,
      name: userinfo.name || userinfo.given_name || 'Google User',
      provider: 'google',
      providerId: userinfo.sub,
      picture: userinfo.picture || '',
    });

    return res.redirect(
      `${clientUrl}/login?token=${result.token}&name=${encodeURIComponent(
        result.user.name
      )}&email=${encodeURIComponent(result.user.email)}`
    );
  } catch (err) {
    console.error('Google OAuth callback error:', err.message);
    return res.redirect(
      `${clientUrl}/login?oauth_error=${encodeURIComponent(
        `Google login failed: ${err.message}`
      )}`
    );
  }
};

/**
 * GET /api/auth/github
 * Redirect to GitHub OAuth consent screen
 */
export const githubAuthRedirect = (req, res) => {
  const clientUrl = getClientUrl(req);
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.redirect(
      `${clientUrl}/login?oauth_error=${encodeURIComponent(
        'GitHub Client ID is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in server/.env'
      )}`
    );
  }

  const backendUrl = getBackendUrl(req);
  const redirectUri = `${backendUrl}/api/auth/github/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=user:email`;

  return res.redirect(githubAuthUrl);
};

/**
 * GET /api/auth/github/callback
 * Handle GitHub OAuth callback
 */
export const githubAuthCallback = async (req, res) => {
  const clientUrl = getClientUrl(req);
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(
      `${clientUrl}/login?oauth_error=${encodeURIComponent(
        error || 'GitHub authentication was cancelled'
      )}`
    );
  }

  try {
    const backendUrl = getBackendUrl(req);
    const redirectUri = `${backendUrl}/api/auth/github/callback`;

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange GitHub OAuth code');
    }

    // Fetch user profile from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'AI-Mock-Interview-App',
      },
    });

    const userData = await userResponse.json();
    let email = userData.email;

    // If email is not public, fetch user emails
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'AI-Mock-Interview-App',
        },
      });
      const emails = await emailsResponse.json();
      if (Array.isArray(emails)) {
        email = emails.find((e) => e.primary && e.verified)?.email || emails[0]?.email;
      }
    }

    if (!email) {
      throw new Error('No verified email found on your GitHub account');
    }

    const result = await authService.socialLoginOrRegister({
      email,
      name: userData.name || userData.login || 'GitHub User',
      provider: 'github',
      providerId: String(userData.id),
      picture: userData.avatar_url || '',
    });

    return res.redirect(
      `${clientUrl}/login?token=${result.token}&name=${encodeURIComponent(
        result.user.name
      )}&email=${encodeURIComponent(result.user.email)}`
    );
  } catch (err) {
    console.error('GitHub OAuth callback error:', err.message);
    return res.redirect(
      `${clientUrl}/login?oauth_error=${encodeURIComponent(
        `GitHub login failed: ${err.message}`
      )}`
    );
  }
};
