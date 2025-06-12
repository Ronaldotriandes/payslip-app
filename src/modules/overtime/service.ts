import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/prisma/src';
import { getIndonesiaDate } from 'src/utils';
import { CreateOvertimeDto } from './dto/create-overtime.dto';

@Injectable()
export class OvertimeService {
    constructor(private readonly prisma: PrismaService) { }

    async createOvertime(user: any, body: CreateOvertimeDto) {
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

        const currentOvt = await this.prisma.overtime.findFirst({
            where: {
                employeeId: user.employee.id,
                date: currentDate,
            },
            select: {
                id: true,
            }
        });
        if (currentOvt) {
            return this.prisma.overtime.update({
                where: {
                    id: currentOvt.id,
                },
                data: {
                    hours: body.hours,
                    description: body.description,
                }
            })
        }
        return this.prisma.overtime.create({
            data: {
                attendancePeriodId: findPeriode.id,
                employeeId: user.employee.id,
                date: currentDate,
                hours: body.hours,
                description: body.description,
            }
        });

    }


}