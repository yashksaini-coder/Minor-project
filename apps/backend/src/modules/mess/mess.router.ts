import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { z } from 'zod';
import * as ctrl from './mess.controller.js';

const router = Router();

const updateMenuSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
  items: z.array(z.string().min(1)),
});

const bookSchema = z.object({
  studentId: z.string().uuid(),
  hostelId: z.string().uuid(),
  date: z.string(),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
});

router.get('/menu/:hostelId', authenticate, ctrl.getMenu);
router.put('/menu/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), validate(updateMenuSchema), ctrl.updateMenu);
router.post('/book', authenticate, validate(bookSchema), ctrl.bookMeal);
router.post('/cancel', authenticate, ctrl.cancelMeal);
router.patch('/bookings/:bookingId/feedback', authenticate, ctrl.submitFeedback);
router.get('/bookings/:studentId', authenticate, ctrl.getBookings);
router.get('/report/:hostelId', authenticate, authorize('ADMIN', 'WARDEN', 'SUPER_ADMIN'), ctrl.getMonthlyReport);

export default router;
