import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/prisma/src';
import { getIndonesiaDate } from 'src/utils';

@Injectable()
export class AttendanceService {
    constructor(private readonly prisma: PrismaService) { }
    private isWeekend(date: Date): boolean {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }
    async createAttendance(user: any) {
        const currentDate = getIndonesiaDate()

        if (this.isWeekend(currentDate)) {
            throw new BadRequestException(`Attendance cannot be recorded on weekends.`);
        }
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
        const currentAttendance = await this.prisma.attendance.findFirst({
            where: {
                employeeId: user.employee.id,
                date: currentDate
            },
            select: {
                id: true,
                checkOutTime: true
            }
        });

        if (currentAttendance && currentAttendance.checkOutTime) {
            throw new BadRequestException('You have already checked out');
        }
        if (currentAttendance) {
            return this.prisma.attendance.update({
                where: {
                    id: currentAttendance.id
                },
                data: {
                    checkOutTime: currentDate,
                }
            })
        }
        return this.prisma.attendance.create({
            data: {
                attendancePeriodId: findPeriode.id,
                employeeId: user.employee.id,
                date: currentDate,
                checkInTime: currentDate,
                isPresent: true,
                createdBy: user.employee.id,
            }
        });

    }


}