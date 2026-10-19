import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
    },
    resumeText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    totalQuestions: {
      type: Number,
      default: 5,
    },
    currentQuestion: {
      type: Number,
      default: 0,
    },
    questions: {
      type: Array,
      default: [],
    },
    messages: {
      type: Array,
      default: [],
    },
    codeSubmissions: {
      type: Array,
      default: [],
    },
    lastAudio: {
      type: String,
      default: '',
    },
    feedback: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    overallScore: {
      type: Number,
      default: null,
    },
    companyTrack: {
      type: String,
      default: 'General',
    },
    interviewerPersona: {
      type: String,
      default: 'Natalie',
    },
    jobDescription: {
      type: String,
      default: '',
    },
    speechMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    pressureMode: {
      type: Boolean,
      default: false,
    },
    isProbing: {
      type: Boolean,
      default: false,
    },
    shareToken: {
      type: String,
      default: null,
      index: true,
    },
    whiteboardData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    visionMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    clarifications: {
      type: Array,
      default: [],
    },
    isSuperday: {
      type: Boolean,
      default: false,
    },
    committeeVote: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;