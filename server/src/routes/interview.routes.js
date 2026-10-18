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
router.get('/:id', getInterview);
router.post('/transcribe', upload.single('audio'), transcribeAudio);
router.post('/:id/answer', submitAnswer);
router.post('/:id/code', submitCode);
router.post('/:id/end', endInterview);
router.post('/:id/audit-whiteboard', auditWhiteboard);
router.post('/:id/share', shareInterview);

export default router;