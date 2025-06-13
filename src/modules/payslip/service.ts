import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'libs/prisma/src';
import { CreatePayrollDto } from './dto/create-payroll.dto';

@Injectable()
export class PayslipService {
    constructor(private readonly prisma: PrismaService) { }

    async createPayroll(user: any, body: CreatePayrollDto) {
        const attendancePeriod = await this.prisma.attendancePeriod.findFirst({
            where: {
                id: body.attendancePeriodId
            }
        });

        if (!attendancePeriod) {
            throw new NotFoundException('Attendance period not found');
        }
        const employeeData = await this.prisma.employee.findMany({
            select: {
                id: true,
                baseSalary: true,
                overtimeRate: true,
                hourlyRate: true,
                fullname: true,
                attendances: {
                    where: {
                        attendancePeriodId: body.attendancePeriodId
                    }
                },
                reimbursements: {
                    where: {
                        attendancePeriodId: body.attendancePeriodId
                    }
                },
                overtimes: {
                    where: {
                        attendancePeriodId: body.attendancePeriodId
                    }
                }
            }
        });
        const storeData = employeeData.map((item) => {
            const result: any = {
                employeeId: item.id,
                attendancePeriodId: body.attendancePeriodId,
                baseSalary: item.baseSalary,
                attendanceDays: item.attendances.length,
                totalWorkingDays: item.attendances.length + item.overtimes.length,
                totalOvertimeHours: item.overtimes.reduce((acc: number, curr) => acc + Number(curr.hours), 0),
                overtimeRate: item.overtimeRate,
                overtimeAmount: item.overtimes.reduce((acc: number, curr) => acc + (Number(curr.hours) * Number(item.overtimeRate) * Number(item.hourlyRate)), 0),
                totalReimbursements: item.reimbursements.reduce((acc: number, curr) => acc + Number(curr.amount), 0),
                createdBy: user?.employee?.id || user.id,
            }
            result.netPay = (Number(result.baseSalary) + Number(result.overtimeAmount) + Number(result.totalReimbursements)).toFixed(2)
            return result
        })
        return await this.prisma.payslip.createMany({
            data: storeData
        })

    }

    async getPayslipByEmployeeId(user: any) {
        const employee = await this.prisma.employee.findFirst({
            where: {
                id: user.employee.id
            },
        })
        if (!employee) {
            throw new NotFoundException('Employee not found');
        }
        const payslip = await this.prisma.payslip.findMany({
            where: {
                employeeId: employee.id
            },
            include: {
                employee: {
                    select: {
                        baseSalary: true,
                        hourlyRate: true,
                        overtimeRate: true,
                    }
                },
                attendancePeriod: {
                    include: {
                        attendances: true,
                        overtimes: true,
                        reimbursements: true,
                    }
                }
            }
        })
        const result = payslip.map((item) => {
            return {
                periode: item.attendancePeriod.name,
                baseSalary: item.baseSalary,
                attendance: {
                    days: item.attendancePeriod.attendances.length,
                },
                overtime: {
                    days: item.attendancePeriod.overtimes.length,
                    hours: item.attendancePeriod.overtimes.reduce((acc: number, curr) => acc + Number(curr.hours), 0),
                    rate: item.overtimeRate,
                    hourlyRate: item.employee.hourlyRate,
                    amount: item.attendancePeriod.overtimes.reduce((acc: number, curr) => acc + (Number(curr.hours) * Number(item.overtimeRate) * Number(item.employee.hourlyRate)), 0),
                },
                reimbursement: {
                    amount: item.attendancePeriod.reimbursements.reduce((acc: number, curr) => acc + Number(curr.amount), 0),
                },
                takeHomePay: Number(item.employee.baseSalary) - item.attendancePeriod.overtimes.reduce((acc: number, curr) => acc + (Number(curr.hours) * Number(item.overtimeRate) * Number(item.employee.hourlyRate)), 0) + item.attendancePeriod.reimbursements.reduce((acc: number, curr) => acc + Number(curr.amount), 0),

            }
        })
        return result

    }
    async getPayslipSummary(user: any) {
        const payslips = await this.prisma.payslip.findMany({
            select: {
                employeeId: true,
                attendancePeriodId: true
            }
        });

        const employeeIds = [...new Set(payslips.map(p => p.employeeId))];

        const payslip = await this.prisma.payslip.findMany({
            include: {
                employee: {
                    select: {
                        id: true,
                        fullname: true,
                        baseSalary: true,
                        hourlyRate: true,
                        overtimeRate: true,
                    }
                },
                attendancePeriod: {
                    include: {
                        attendances: {
                            where: {
                                employeeId: {
                                    in: employeeIds
                                }
                            }
                        },
                        overtimes: {
                            where: {
                                employeeId: {
                                    in: employeeIds
                                }
                            }
                        },
                        reimbursements: {
                            where: {
                                employeeId: {
                                    in: employeeIds
                                }
                            }
                        },
                    }
                }
            }
        });

        const result = payslip.map((item) => {
            const employeeAttendances = item.attendancePeriod.attendances.filter(
                attendance => attendance.employeeId === item.employeeId
            );

            const employeeOvertimes = item.attendancePeriod.overtimes.filter(
                overtime => overtime.employeeId === item.employeeId
            );

            const employeeReimbursements = item.attendancePeriod.reimbursements.filter(
                reimbursement => reimbursement.employeeId === item.employeeId
            );

            return {
                employee: {
                    id: item.employee.id,
                    fullname: item.employee.fullname,
                },
                periode: item.attendancePeriod.name,
                baseSalary: item.baseSalary,
                attendance: {
                    days: employeeAttendances.length,
                },
                overtime: {
                    days: employeeOvertimes.length,
                    hours: employeeOvertimes.reduce((acc: number, curr) => acc + Number(curr.hours), 0),
                    rate: item.overtimeRate,
                    hourlyRate: item.employee.hourlyRate,
                    amount: employeeOvertimes.reduce((acc: number, curr) => acc + (Number(curr.hours) * Number(item.overtimeRate) * Number(item.employee.hourlyRate)), 0),
                },
                reimbursement: {
                    amount: employeeReimbursements.reduce((acc: number, curr) => acc + Number(curr.amount), 0),
                },
                takeHomePay: Number(item.employee.baseSalary) + employeeOvertimes.reduce((acc: number, curr) => acc + (Number(curr.hours) * Number(item.overtimeRate) * Number(item.employee.hourlyRate)), 0) + employeeReimbursements.reduce((acc: number, curr) => acc + Number(curr.amount), 0),
            }
        });

        return result;
    }
}