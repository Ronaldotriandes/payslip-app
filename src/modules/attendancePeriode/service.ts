import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/prisma/src';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period-dto';

@Injectable()
export class AttendancePeriodeService {
    constructor(private readonly prisma: PrismaService) { }

    async createAttendancePeriod(user: any, createAttendancePeriodDto: CreateAttendancePeriodDto) {
        const { startDate, endDate, name } = createAttendancePeriodDto;

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end <= start) {
            throw new BadRequestException('End date must be after start date');
        }

        return await this.prisma.attendancePeriod.create({
            data: {
                startDate: start,
                endDate: end,
                status: 'ACTIVE',
                name,
                createdBy: user?.employee?.id || user.id,
            },
        });

    }


}