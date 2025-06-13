import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/prisma/src';
import { getIndonesiaDate } from 'src/utils';
import { CreateReimbursementDto } from './dto/reimbursements.dto';

@Injectable()
export class ReimbursementsService {
    constructor(private readonly prisma: PrismaService) { }

    async createReimbursement(user: any, body: CreateReimbursementDto) {
        const currentDate = getIndonesiaDate()
        const findPeriode = await this.prisma.attendancePeriod.findFirst({
            where: {
                startDate: {
                    lte: currentDate,
                },
                endDate: {
                    gte: currentDate,
                },
                status: 'ACTIVE',
            },
            select: {
                id: true,
            }
        });

        if (!findPeriode) {
            throw new ConflictException('An attendance period already exists for the current date');
        }

        return this.prisma.reimbursement.create({
            data: {
                attendancePeriodId: findPeriode.id,
                employeeId: user.employee.id,
                amount: body.amount,
                description: body.description,
                createdBy: user?.employee?.id || user.id,
            }
        });

    }


}