import { Router } from 'express';
import { getChatRooms, getMessages, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/rooms', protect, getChatRooms);
router.post('/send', protect, sendMessage);
router.get('/:chatRoomId/messages', protect, getMessages);

export default router;
