import { prisma } from '../../config/database.js';
import { AppError } from '../../shared/middleware/errorHandler.js';
import { Prisma, FeeStatus } from '@prisma/client';

export class FeesService {
  async list(query: {
    hostelId?: string; studentId?: string; status?: string; type?: string;
    page?: number; limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: Prisma.FeeRecordWhereInput = {
      ...(query.hostelId && { hostelId: query.hostelId }),
      ...(query.studentId && { studentId: query.studentId }),
      ...(query.status && { status: query.status as FeeStatus }),
      ...(query.type && { type: query.type as any }),
    };

    const [fees, total] = await Promise.all([
      prisma.feeRecord.findMany({
        where,
        include: { student: { include: { user: { select: { name: true, email: true, phone: true } } } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'desc' },
      }),
      prisma.feeRecord.count({ where }),
    ]);

    return { fees, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const fee = await prisma.feeRecord.findUnique({
      where: { id },
      include: { student: { include: { user: { select: { name: true, email: true } } } } },
    });
    if (!fee) throw new AppError(404, 'Fee record not found');
    return fee;
  }

  async create(data: {
    studentId: string; hostelId: string; type: string; amount: number;
    dueDate: string; remarks?: string;
  }) {
    return prisma.feeRecord.create({
      data: {
        studentId: data.studentId,
        hostelId: data.hostelId,
        type: data.type as any,
        amount: data.amount,
        dueDate: new Date(data.dueDate),
        remarks: data.remarks,
      },
    });
  }

  async recordPayment(id: string, data: {
    paidAmount: number; paymentMethod: string; transactionId?: string;
  }) {
    const fee = await prisma.feeRecord.findUnique({ where: { id } });
    if (!fee) throw new AppError(404, 'Fee record not found');

    const totalPaid = Number(fee.paidAmount) + data.paidAmount;
    const status: FeeStatus = totalPaid >= Number(fee.amount) ? 'PAID' : 'PARTIALLY_PAID';

    return prisma.feeRecord.update({
      where: { id },
      data: {
        paidAmount: totalPaid,
        paidDate: new Date(),
        paymentMethod: data.paymentMethod as any,
        transactionId: data.transactionId,
        status,
      },
    });
  }

  async waive(id: string, remarks: string) {
    return prisma.feeRecord.update({
      where: { id },
      data: { status: 'WAIVED', remarks },
    });
  }

  async getStudentBalance(studentId: string) {
    const fees = await prisma.feeRecord.findMany({
      where: { studentId, status: { in: ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] } },
    });
    const totalDue = fees.reduce((sum, f) => sum + Number(f.amount) - Number(f.paidAmount), 0);
    return { totalDue, pendingFees: fees.length };
  }
}

export const feesService = new FeesService();
