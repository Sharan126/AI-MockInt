import { Router } from 'express';
import multer from 'multer';
import {
  startInterview,
  getInterview,
  submitAnswer,
  submitCode,
  endInterview,
  transcribeAudio,
  auditWhiteboard,
  optimizeResume,
  shareInterview,
  getSharedInterview,
  updateGoal,
  clarifyQuestion,
  saveVisionMetrics,
  auditStarStory,
  getStarStories,
  saveStarStory,
  deleteStarStory,
  simulateNegotiation,
} from '../controllers/interview.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Public route for shared interview review
router.get('/shared/:token', getSharedInterview);

// Protected routes
router.use(authenticate);
router.post('/start', startInterview);
router.post('/optimize-resume', optimizeResume);
router.post('/goal', updateGoal);

// STAR Story Bank endpoints
router.get('/star', getStarStories);
router.post('/star', saveStarStory);
router.post('/star/audit', auditStarStory);
router.delete('/star/:storyId', deleteStarStory);

// AI Compensation Negotiation simulator
router.post('/negotiate', simulateNegotiation);

// Active interview session routes
router.get('/:id', getInterview);
router.post('/transcribe', upload.single('audio'), transcribeAudio);
router.post('/:id/answer', submitAnswer);
router.post('/:id/code', submitCode);
router.post('/:id/end', endInterview);
router.post('/:id/audit-whiteboard', auditWhiteboard);
router.post('/:id/share', shareInterview);
router.post('/:id/clarify', clarifyQuestion);
router.post('/:id/vision', saveVisionMetrics);

export default router;