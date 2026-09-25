import { Router } from 'express';
import {
  getSavedSearches,
  createSavedSearch,
  deleteSavedSearch,
} from '../controllers/savedSearchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { savedSearchSchema, validate } from '../../shared/schemas.js';

const router = Router();

router.use(protect);

router.get('/', getSavedSearches);
router.post('/', validate(savedSearchSchema), createSavedSearch);
router.delete('/:id', deleteSavedSearch);

export default router;
