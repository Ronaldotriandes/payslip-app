import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'libs/prisma/src';
import * as utils from 'src/utils';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { OvertimeService } from './service';

jest.mock('src/utils', () => ({
    getIndonesiaDate: jest.fn(),
}));

describe('OvertimeService', () => {
    let service: OvertimeService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockUser = {
        id: '1',
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

    const mockOvertime = {
        id: 'overtime-1',
        employeeId: 'emp-1',
        attendancePeriodId: 'period-1',
        date: new Date('2024-01-15'),
        hours: 2,
        description: 'Project deadline work',
        createdAt: new Date('2024-01-15T18:00:00Z'),
        updatedAt: new Date('2024-01-15T18:00:00Z')
    };

    beforeEach(async () => {
        const mockPrismaService = {
            attendancePeriod: {
                findFirst: jest.fn(),
            },
            overtime: {
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OvertimeService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<OvertimeService>(OvertimeService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createOvertime', () => {
        const mockCurrentDate = new Date('2024-01-15T18:00:00Z');
        const validOvertimeDto: CreateOvertimeDto = {
            hours: 2,
            description: 'Working on urgent project',
            date: '2025-06-02'
        };

        beforeEach(() => {
            (utils.getIndonesiaDate as jest.Mock).mockReturnValue(mockCurrentDate);
        });

        it('should throw ConflictException when no active attendance period exists', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.createOvertime(mockUser, validOvertimeDto)).rejects.toThrow(ConflictException);
            await expect(service.createOvertime(mockUser, validOvertimeDto)).rejects.toThrow('An attendance period already exists for the current date');

            expect(prismaService.attendancePeriod.findFirst).toHaveBeenCalledWith({
                where: {
                    startDate: {
                        lte: mockCurrentDate,
                    },
                    endDate: {
                        gte: mockCurrentDate,
                    },
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                }
            });
        });

        it('should create new overtime when no existing overtime for the date', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.overtime.create as jest.Mock).mockResolvedValue(mockOvertime);

            const result = await service.createOvertime(mockUser, validOvertimeDto);

            expect(result).toEqual(mockOvertime);
            expect(prismaService.overtime.create).toHaveBeenCalledWith({
                data: {
                    attendancePeriodId: mockAttendancePeriod.id,
                    employeeId: mockUser.employee.id,
                    date: mockCurrentDate,
                    hours: validOvertimeDto.hours,
                    description: validOvertimeDto.description,
                    createdBy: mockUser.employee.id || mockUser.id,
                }
            });
        });

        it('should update existing overtime when overtime already exists for the date', async () => {
            const updatedOvertimeDto: CreateOvertimeDto = {
                hours: 3,
                description: 'Updated overtime description',
                date: '2025-06-02'
            };

            const updatedOvertime = {
                ...mockOvertime,
                hours: 3,
                description: 'Updated overtime description'
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(mockOvertime);
            (prismaService.overtime.update as jest.Mock).mockResolvedValue(updatedOvertime);

            const result = await service.createOvertime(mockUser, updatedOvertimeDto);

            expect(result).toEqual(updatedOvertime);
            expect(prismaService.overtime.update).toHaveBeenCalledWith({
                where: {
                    id: mockOvertime.id,
                },
                data: {
                    hours: updatedOvertimeDto.hours,
                    description: updatedOvertimeDto.description,
                }
            });
        });

        it('should verify overtime query parameters', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.overtime.create as jest.Mock).mockResolvedValue(mockOvertime);

            await service.createOvertime(mockUser, validOvertimeDto);

            expect(prismaService.overtime.findFirst).toHaveBeenCalledWith({
                where: {
                    employeeId: mockUser.employee.id,
                    date: mockCurrentDate,
                },
                select: {
                    id: true,
                }
            });
        });

        it('should handle different overtime hours correctly', async () => {
            const testCases = [
                {
                    hours: 1, description: 'One hour overtime', date: '2025-06-02'
                },
                {
                    hours: 4, description: 'Four hours overtime', date: '2025-06-02'
                },
                {
                    hours: 0.5, description: 'Half hour overtime', date: '2025-06-02'
                },
                {
                    hours: 8, description: 'Full day overtime', date: '2025-06-02'
                }
            ];

            for (const testCase of testCases) {
                (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
                (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(null);
                (prismaService.overtime.create as jest.Mock).mockResolvedValue({
                    ...mockOvertime,
                    hours: testCase.hours,
                    description: testCase.description
                });

                await service.createOvertime(mockUser, testCase);

                expect(prismaService.overtime.create).toHaveBeenCalledWith({
                    data: {
                        attendancePeriodId: mockAttendancePeriod.id,
                        employeeId: mockUser.employee.id,
                        date: mockCurrentDate,
                        hours: testCase.hours,
                        description: testCase.description,
                        createdBy: mockUser.employee.id || mockUser.id,
                    }
                });

                jest.clearAllMocks();
                (utils.getIndonesiaDate as jest.Mock).mockReturnValue(mockCurrentDate);
            }
        });

        it('should handle empty description', async () => {
            const overtimeWithEmptyDescription: CreateOvertimeDto = {
                hours: 2,
                description: '',
                date: '2025-06-02'
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.overtime.create as jest.Mock).mockResolvedValue({
                ...mockOvertime,
                description: ''
            });

            const result = await service.createOvertime(mockUser, overtimeWithEmptyDescription);

            expect(result.description).toBe('');
            expect(prismaService.overtime.create).toHaveBeenCalledWith({
                data: {
                    attendancePeriodId: mockAttendancePeriod.id,
                    employeeId: mockUser.employee.id,
                    date: mockCurrentDate,
                    hours: 2,
                    description: '',
                    createdBy: mockUser.employee.id || mockUser.id,
                }
            });
        });

        it('should handle long description', async () => {
            const longDescription = 'A'.repeat(500);
            const overtimeWithLongDescription: CreateOvertimeDto = {
                hours: 3,
                description: longDescription,
                date: '2025-06-02'
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.overtime.create as jest.Mock).mockResolvedValue({
                ...mockOvertime,
                description: longDescription
            });

            const result = await service.createOvertime(mockUser, overtimeWithLongDescription);

            expect(result.description).toBe(longDescription);
        });

        it('should handle user without employee relation', async () => {
            const userWithoutEmployee = {
                id: '1',
                username: 'testuser',
                employee: null
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);

            await expect(service.createOvertime(userWithoutEmployee, validOvertimeDto)).rejects.toThrow();
        });

        it('should handle database errors during creation', async () => {
            const dbError = new Error('Database connection failed');
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.overtime.create as jest.Mock).mockRejectedValue(dbError);

            await expect(service.createOvertime(mockUser, validOvertimeDto)).rejects.toThrow('Database connection failed');
        });

        it('should handle database errors during update', async () => {
            const dbError = new Error('Update failed');
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(mockOvertime);
            (prismaService.overtime.update as jest.Mock).mockRejectedValue(dbError);

            await expect(service.createOvertime(mockUser, validOvertimeDto)).rejects.toThrow('Update failed');
        });

        it('should verify attendance period query with correct date range', async () => {
            const specificDate = new Date('2024-06-15T20:30:00Z');
            (utils.getIndonesiaDate as jest.Mock).mockReturnValue(specificDate);

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.overtime.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.overtime.create as jest.Mock).mockResolvedValue(mockOvertime);

            await service.createOvertime(mockUser, validOvertimeDto);

            expect(prismaService.attendancePeriod.findFirst).toHaveBeenCalledWith({
                where: {
                    startDate: {
                        lte: specificDate,
                    },
                    endDate: {
                        gte: specificDate,
                    },
                    status: 'ACTIVE',
                },
                select: {
                    id: true,
                }
            });
        });

    });
})