import { Router } from 'express';
import multer from 'multer';
import {
  startInterview,
  getInterview,
  submitAnswer,
  submitCode,
  endInterview,
  transcribeAudio,
} from '../controllers/interview.controller.js';
import authenticate from '../middleware/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticate);
router.post('/start', startInterview);
router.get('/:id', getInterview);
router.post('/transcribe', upload.single('audio'), transcribeAudio);
router.post('/:id/answer', submitAnswer);
router.post('/:id/code', submitCode);
router.post('/:id/end', endInterview);

export default router;