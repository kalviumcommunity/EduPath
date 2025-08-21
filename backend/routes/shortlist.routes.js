import express from 'express';
import { auth } from '../middleware/auth.middleware.js';
import { getShortlist, addToShortlist, removeFromShortlist } from '../controllers/shortlist.controller.js';
const router = express.Router();

router.get('/', auth, getShortlist);
router.post('/', auth, addToShortlist);
router.delete('/:id', auth, removeFromShortlist);

export default router;
