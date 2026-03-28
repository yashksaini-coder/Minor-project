import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import * as ctrl from './notifications.controller.js';

const router = Router();

router.get('/', authenticate, ctrl.list);
router.patch('/:id/read', authenticate, ctrl.markAsRead);
router.patch('/read-all', authenticate, ctrl.markAllAsRead);
router.post('/broadcast', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.broadcast);

export default router;
