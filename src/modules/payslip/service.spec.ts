import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'libs/prisma/src';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { PayslipService } from './service';

describe('PayslipService', () => {
    let service: PayslipService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockUser = {
        id: 'user-1',
        username: 'testuser',
        employee: {
            id: 'emp-1',
            fullname: 'Test Employee'
        }
    };

    const mockAttendancePeriod = {
        id: 'period-1',
        name: 'January 2024 Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'ACTIVE'
    };

    const mockEmployee = {
        id: 'emp-1',
        fullname: 'Test Employee',
        baseSalary: 5000000,
        overtimeRate: 1.5,
        hourlyRate: 25000,
        attendances: [
            { id: 'att-1', date: new Date('2024-01-15') },
            { id: 'att-2', date: new Date('2024-01-16') }
        ],
        reimbursements: [
            { id: 'reimb-1', amount: 100000 }
        ],
        overtimes: [
            { id: 'ovt-1', hours: 2 },
            { id: 'ovt-2', hours: 3 }
        ]
    };

    const mockPayslip = {
        id: 'payslip-1',
        employeeId: 'emp-1',
        attendancePeriodId: 'period-1',
        baseSalary: 5000000,
        attendanceDays: 2,
        totalWorkingDays: 4,
        totalOvertimeHours: 5,
        overtimeRate: 1.5,
        overtimeAmount: 187500,
        totalReimbursements: 100000,
        netPay: '5287500.00',
        createdBy: 'emp-1',
        employee: {
            baseSalary: 5000000,
            hourlyRate: 25000,
            overtimeRate: 1.5,
        },
        attendancePeriod: {
            name: 'January 2024 Period',
            attendances: [
                { id: 'att-1', employeeId: 'emp-1' },
                { id: 'att-2', employeeId: 'emp-1' }
            ],
            overtimes: [
                { id: 'ovt-1', employeeId: 'emp-1', hours: 2 },
                { id: 'ovt-2', employeeId: 'emp-1', hours: 3 }
            ],
            reimbursements: [
                { id: 'reimb-1', employeeId: 'emp-1', amount: 100000 }
            ]
        }
    };

    beforeEach(async () => {
        const mockPrismaService = {
            attendancePeriod: {
                findFirst: jest.fn(),
            },
            employee: {
                findFirst: jest.fn(),
                findMany: jest.fn(),
            },
            payslip: {
                createMany: jest.fn(),
                findMany: jest.fn(),
            },
            attendance: {
                findMany: jest.fn(),
            },
            overtime: {
                findMany: jest.fn(),
            },
            reimbursement: {
                findMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PayslipService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<PayslipService>(PayslipService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createPayroll', () => {
        const createPayrollDto: CreatePayrollDto = {
            attendancePeriodId: 'period-1'
        };

        it('should throw NotFoundException when attendance period not found', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.createPayroll(mockUser, createPayrollDto)).rejects.toThrow(NotFoundException);
            await expect(service.createPayroll(mockUser, createPayrollDto)).rejects.toThrow('Attendance period not found');

            expect(prismaService.attendancePeriod.findFirst).toHaveBeenCalledWith({
                where: {
                    id: createPayrollDto.attendancePeriodId
                }
            });
        });

        it('should create payroll successfully when attendance period exists', async () => {
            const mockCreateManyResult = { count: 1 };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);
            (prismaService.payslip.createMany as jest.Mock).mockResolvedValue(mockCreateManyResult);

            const result = await service.createPayroll(mockUser, createPayrollDto);

            expect(result).toEqual(mockCreateManyResult);
            expect(prismaService.employee.findMany).toHaveBeenCalledWith({
                select: {
                    id: true,
                    baseSalary: true,
                    overtimeRate: true,
                    hourlyRate: true,
                    fullname: true,
                    attendances: {
                        where: {
                            attendancePeriodId: createPayrollDto.attendancePeriodId
                        }
                    },
                    reimbursements: {
                        where: {
                            attendancePeriodId: createPayrollDto.attendancePeriodId
                        }
                    },
                    overtimes: {
                        where: {
                            attendancePeriodId: createPayrollDto.attendancePeriodId
                        }
                    }
                }
            });
        });

        it('should calculate payroll data correctly', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);
            (prismaService.payslip.createMany as jest.Mock).mockResolvedValue({ count: 1 });

            await service.createPayroll(mockUser, createPayrollDto);

            expect(prismaService.payslip.createMany).toHaveBeenCalledWith({
                data: [{
                    employeeId: mockEmployee.id,
                    attendancePeriodId: createPayrollDto.attendancePeriodId,
                    baseSalary: mockEmployee.baseSalary,
                    attendanceDays: 2,
                    totalWorkingDays: 4,
                    totalOvertimeHours: 5,
                    overtimeRate: mockEmployee.overtimeRate,
                    overtimeAmount: 187500,
                    totalReimbursements: 100000,
                    createdBy: mockUser.employee.id,
                    netPay: '5287500.00'
                }]
            });
        });

        it('should handle user without employee relation', async () => {
            const userWithoutEmployee = {
                id: 'user-1',
                username: 'testuser',
                employee: null
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);
            (prismaService.payslip.createMany as jest.Mock).mockResolvedValue({ count: 1 });

            await service.createPayroll(userWithoutEmployee, createPayrollDto);

            expect(prismaService.payslip.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        createdBy: userWithoutEmployee.id
                    })
                ])
            });
        });

        it('should handle multiple employees', async () => {
            const mockEmployees = [
                { ...mockEmployee, id: 'emp-1' },
                { ...mockEmployee, id: 'emp-2', fullname: 'Employee 2' }
            ];

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
            (prismaService.payslip.createMany as jest.Mock).mockResolvedValue({ count: 2 });

            const result = await service.createPayroll(mockUser, createPayrollDto);

            expect(result.count).toBe(2);
            expect(prismaService.payslip.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({ employeeId: 'emp-1' }),
                    expect.objectContaining({ employeeId: 'emp-2' })
                ])
            });
        });

        it('should handle employees with no attendance/overtime/reimbursements', async () => {
            const employeeWithNoData = {
                ...mockEmployee,
                attendances: [],
                overtimes: [],
                reimbursements: []
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.employee.findMany as jest.Mock).mockResolvedValue([employeeWithNoData]);
            (prismaService.payslip.createMany as jest.Mock).mockResolvedValue({ count: 1 });

            await service.createPayroll(mockUser, createPayrollDto);

            expect(prismaService.payslip.createMany).toHaveBeenCalledWith({
                data: [{
                    employeeId: employeeWithNoData.id,
                    attendancePeriodId: createPayrollDto.attendancePeriodId,
                    baseSalary: employeeWithNoData.baseSalary,
                    attendanceDays: 0,
                    totalWorkingDays: 0,
                    totalOvertimeHours: 0,
                    overtimeRate: employeeWithNoData.overtimeRate,
                    overtimeAmount: 0,
                    totalReimbursements: 0,
                    createdBy: mockUser.employee.id,
                    netPay: '5000000.00'
                }]
            });
        });
    });

    describe('getPayslipByEmployeeId', () => {
        it('should throw NotFoundException when employee not found', async () => {
            (prismaService.employee.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.getPayslipByEmployeeId(mockUser)).rejects.toThrow(NotFoundException);
            await expect(service.getPayslipByEmployeeId(mockUser)).rejects.toThrow('Employee not found');

            expect(prismaService.employee.findFirst).toHaveBeenCalledWith({
                where: {
                    id: mockUser.employee.id
                }
            });
        });

        it('should return formatted payslip data when employee exists', async () => {
            (prismaService.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
            (prismaService.payslip.findMany as jest.Mock).mockResolvedValue([mockPayslip]);

            const result = await service.getPayslipByEmployeeId(mockUser);

            expect(result).toEqual([{
                periode: mockPayslip.attendancePeriod.name,
                baseSalary: mockPayslip.baseSalary,
                attendance: {
                    days: 2
                },
                overtime: {
                    days: 2,
                    hours: 5,
                    rate: mockPayslip.overtimeRate,
                    hourlyRate: mockPayslip.employee.hourlyRate,
                    amount: 187500
                },
                reimbursement: {
                    amount: 100000
                },
                takeHomePay: 4912500
            }]);
        });

        it('should query payslips with correct parameters', async () => {
            (prismaService.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
            (prismaService.payslip.findMany as jest.Mock).mockResolvedValue([mockPayslip]);

            await service.getPayslipByEmployeeId(mockUser);

            expect(prismaService.payslip.findMany).toHaveBeenCalledWith({
                where: {
                    employeeId: mockEmployee.id
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
            });
        });

        it('should handle multiple payslips', async () => {
            const multiplePayslips = [
                mockPayslip,
                { ...mockPayslip, id: 'payslip-2', attendancePeriod: { ...mockPayslip.attendancePeriod, name: 'February 2024' } }
            ];

            (prismaService.employee.findFirst as jest.Mock).mockResolvedValue(mockEmployee);
            (prismaService.payslip.findMany as jest.Mock).mockResolvedValue(multiplePayslips);

            const result = await service.getPayslipByEmployeeId(mockUser);

            expect(result).toHaveLength(2);
            expect(result[0].periode).toBe('January 2024 Period');
            expect(result[1].periode).toBe('February 2024');
        });
    })
})