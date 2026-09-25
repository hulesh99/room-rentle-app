import { Router } from 'express';
import {
  sendBookingRequest,
  getReceivedRequests,
  getSentRequests,
  updateRequestStatus,
  cancelBookingRequest,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isOwner, isRenter } from '../middleware/roleMiddleware.js';

const router = Router();

router.post('/', protect, isRenter, sendBookingRequest);
router.get('/received', protect, isOwner, getReceivedRequests);
router.get('/sent', protect, isRenter, getSentRequests);
router.put('/:id/status', protect, isOwner, updateRequestStatus);
router.delete('/:id', protect, isRenter, cancelBookingRequest);

export default router;
