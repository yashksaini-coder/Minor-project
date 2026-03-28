import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma, StudentStatus } from '@prisma/client';

export class StudentsService {
  async list(hostelId: string | undefined, query: {
    page?: number; limit?: number; search?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.StudentProfileWhereInput = {
      ...(hostelId && { user: { hostelId } }),
      ...(query.status && { status: query.status as StudentStatus }),
      ...(query.search && {
        OR: [
          { rollNumber: { contains: query.search, mode: 'insensitive' } },
          { user: { name: { contains: query.search, mode: 'insensitive' } } },
          { user: { email: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [students, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true, phone: true, role: true, avatarUrl: true, isActive: true, hostelId: true, createdAt: true, updatedAt: true } }, bed: { include: { room: { include: { block: true } } } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return {
      students,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true, role: true, avatarUrl: true, isActive: true, hostelId: true, createdAt: true, updatedAt: true } },
        bed: { include: { room: { include: { block: true } } } },
        feeRecords: { orderBy: { createdAt: 'desc' }, take: 5 },
        complaints: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!student) throw new AppError(404, 'Student not found');
    return student;
  }

  async apply(data: {
    email: string; password: string; name: string; phone?: string;
    rollNumber: string; department: string; year: number; gender: string;
    parentName: string; parentPhone: string; permanentAddress: string; hostelId: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, 'Email already registered');

    const existingRoll = await prisma.studentProfile.findUnique({ where: { rollNumber: data.rollNumber } });
    if (existingRoll) throw new AppError(409, 'Roll number already registered');

    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        name: data.name,
        phone: data.phone,
        role: 'STUDENT',
        hostelId: data.hostelId,
        studentProfile: {
          create: {
            rollNumber: data.rollNumber,
            department: data.department,
            year: data.year,
            gender: data.gender as any,
            parentName: data.parentName,
            parentPhone: data.parentPhone,
            permanentAddress: data.permanentAddress,
          },
        },
      },
      include: { studentProfile: true },
    });

    const { password: _, ...userData } = user;
    return userData;
  }

  async approve(id: string) {
    const student = await prisma.studentProfile.update({
      where: { id },
      data: { status: 'APPROVED', joinDate: new Date() },
    });
    return student;
  }

  async reject(id: string, reason?: string) {
    return prisma.studentProfile.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async checkout(id: string) {
    const student = await prisma.studentProfile.findUnique({ where: { id } });
    if (!student) throw new AppError(404, 'Student not found');

    // Free up the bed
    if (student.bedId) {
      await prisma.bed.update({ where: { id: student.bedId }, data: { status: 'VACANT' } });
    }

    return prisma.studentProfile.update({
      where: { id },
      data: { status: 'CHECKED_OUT', checkoutDate: new Date(), bedId: null },
    });
  }

  async update(id: string, data: Partial<{
    department: string; year: number; parentName: string; parentPhone: string; permanentAddress: string;
  }>) {
    return prisma.studentProfile.update({ where: { id }, data });
  }
}

export const studentsService = new StudentsService();
