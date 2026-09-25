import { Router } from 'express';
import {
  getRooms,
  getMyRooms,
  getRoomById,
  createRoom,
  updateRoom,
  toggleAvailability,
  deleteRoom,
} from '../controllers/roomController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { isOwner } from '../middleware/roleMiddleware.js';
import { uploadRoomImages } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', getRooms);
router.get('/owner/my-rooms', protect, isOwner, getMyRooms);
router.get('/:id', optionalAuth, getRoomById);

router.post('/', protect, isOwner, uploadRoomImages, createRoom);
router.put('/:id', protect, isOwner, uploadRoomImages, updateRoom);
router.patch('/:id/availability', protect, isOwner, toggleAvailability);
router.delete('/:id', protect, isOwner, deleteRoom);

export default router;
