// ============================================
// User.model.js - User Database Schema
// ============================================
// Defines what a "User" looks like in our database.
// Users sign in via email/password.
// Reference: mongoose.Schema, mongoose.model - reference-mongodb.md
// ============================================

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // User's email address
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // User's display name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Hashed password (optional for OAuth users)
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
    },

    // Authentication provider
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local',
    },

    // Provider ID for OAuth
    providerId: {
      type: String,
      default: '',
    },

    // URL to the user's profile picture
    picture: {
      type: String,
      default: '',
    },

    // When the user last logged in
    lastLogin: {
      type: Date,
      default: Date.now,
    },

    // User preferences (for settings)
    preferences: {
      preferredRole: { type: String, default: 'Full Stack Developer' },
      difficulty: { type: String, default: 'medium' },
      codeLanguage: { type: String, default: 'javascript' },
      voiceSpeed: { type: String, default: 'normal' },
    },

    // Password reset fields
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    // Candidate target interview goal & sprint roadmap
    targetGoal: {
      targetCompany: { type: String, default: 'Google' },
      targetRole: { type: String, default: 'Software Engineer' },
      targetDate: { type: Date, default: null },
      prepStreak: { type: Number, default: 3 },
    },

    // Candidate behavioral STAR story bank
    starStories: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create the model from the schema
// "User" → Mongoose will create a "users" collection in MongoDB
const User = mongoose.model('User', userSchema);

export default User;
