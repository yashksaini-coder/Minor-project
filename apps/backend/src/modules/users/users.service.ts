import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class UsersService {
  async list(query: {
    hostelId?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.hostelId && { hostelId: query.hostelId }),
      ...(query.role && { role: query.role as any }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          hostelId: true,
          createdAt: true,
          updatedAt: true,
          studentProfile: {
            select: {
              id: true,
              rollNumber: true,
              department: true,
              year: true,
              status: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}

export const usersService = new UsersService();
