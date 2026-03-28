import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import * as ctrl from './hostels.controller.js';

const router = Router();

router.get('/:id', authenticate, ctrl.getById);
router.patch('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), ctrl.update);

export default router;
