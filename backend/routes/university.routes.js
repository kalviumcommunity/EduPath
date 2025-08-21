import express from 'express';
import { getUniversities, getUniversityById, getUniversityCount } from '../controllers/university.controller.js';

const router = express.Router();

router.get('/', getUniversities);
router.get('/count/all', getUniversityCount);
router.get('/:id', getUniversityById);

export default router;
