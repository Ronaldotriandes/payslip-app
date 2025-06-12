import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/prisma/src';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period-dto';

@Injectable()
export class AttendancePeriodeService {
    constructor(private readonly prisma: PrismaService) { }

    async createAttendancePeriod(createAttendancePeriodDto: CreateAttendancePeriodDto) {
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
                name
            },
        });
        const existingPeriod = await this.prisma.attendancePeriod.findFirst({
            where: {
                OR: [
                    {
                        AND: [
                            { startDate: { lte: end } },
                            { endDate: { gte: start } }
                        ]
                    }
                ]
            }
        });

        if (existingPeriod) {
            throw new ConflictException('Attendance period overlaps with existing period for this payroll');
        }

        try {

            return {
                success: true,
                message: 'Attendance period created successfully',
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Attendance period with these details already exists');
            }
            throw error;
        }
    }


}