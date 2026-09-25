import { Router } from 'express';
import { getWishlist, toggleWishlistRoom } from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isRenter } from '../middleware/roleMiddleware.js';

const router = Router();

router.use(protect, isRenter);

router.get('/', getWishlist);
router.post('/:roomId/toggle', toggleWishlistRoom);

export default router;
