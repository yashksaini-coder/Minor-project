import { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { success } from '../../shared/utils/apiResponse.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersService.list({
    hostelId: req.query.hostelId as string,
    role: req.query.role as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  success(res, result.users, 'Success', 200, result.meta);
});
