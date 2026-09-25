import { Router } from 'express';
import { getAgoraConfig, initiateCall } from '../controllers/callController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/config', protect, getAgoraConfig);
router.post('/initiate', protect, initiateCall);

export default router;
