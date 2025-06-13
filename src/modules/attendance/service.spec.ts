import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'libs/prisma/src';
import * as utils from 'src/utils';
import { AttendanceService } from './service';

jest.mock('src/utils', () => ({
    getIndonesiaDate: jest.fn(),
}));

describe('AttendanceService', () => {
    let service: AttendanceService;
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
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'ACTIVE'
    };

    const mockAttendance = {
        id: 'attendance-1',
        employeeId: 'emp-1',
        attendancePeriodId: 'period-1',
        date: new Date('2024-01-15'),
        checkInTime: new Date('2024-01-15T08:00:00Z'),
        checkOutTime: null,
        isPresent: true
    };

    beforeEach(async () => {
        const mockPrismaService = {
            attendancePeriod: {
                findFirst: jest.fn(),
            },
            attendance: {
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AttendanceService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<AttendanceService>(AttendanceService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('isWeekend', () => {
        it('should return true for Sunday', () => {
            const sunday = new Date('2024-01-14');
            expect(service['isWeekend'](sunday)).toBe(true);
        });

        it('should return true for Saturday', () => {
            const saturday = new Date('2024-01-13');
            expect(service['isWeekend'](saturday)).toBe(true);
        });

        it('should return false for weekdays', () => {
            const monday = new Date('2024-01-15');
            expect(service['isWeekend'](monday)).toBe(false);

            const wednesday = new Date('2024-01-17');
            expect(service['isWeekend'](wednesday)).toBe(false);

            const friday = new Date('2024-01-19');
            expect(service['isWeekend'](friday)).toBe(false);
        });
    });

    describe('createAttendance', () => {
        const mockCurrentDate = new Date('2024-01-15T08:00:00Z');

        beforeEach(() => {
            (utils.getIndonesiaDate as jest.Mock).mockReturnValue(mockCurrentDate);
        });

        it('should throw BadRequestException when trying to create attendance on weekend', async () => {
            const weekendDate = new Date('2024-01-14T08:00:00Z');
            (utils.getIndonesiaDate as jest.Mock).mockReturnValue(weekendDate);

            await expect(service.createAttendance(mockUser)).rejects.toThrow(BadRequestException);
            await expect(service.createAttendance(mockUser)).rejects.toThrow('Attendance cannot be recorded on weekends.');
        });

        it('should throw ConflictException when no active attendance period exists', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.createAttendance(mockUser)).rejects.toThrow(ConflictException);
            await expect(service.createAttendance(mockUser)).rejects.toThrow('An attendance period already exists for the current date');

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

        it('should throw BadRequestException when user has already checked out', async () => {
            const attendanceWithCheckOut = {
                ...mockAttendance,
                checkOutTime: new Date('2024-01-15T17:00:00Z')
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.attendance.findFirst as jest.Mock).mockResolvedValue(attendanceWithCheckOut);

            await expect(service.createAttendance(mockUser)).rejects.toThrow(BadRequestException);
            await expect(service.createAttendance(mockUser)).rejects.toThrow('You have already checked out');

            expect(prismaService.attendance.findFirst).toHaveBeenCalledWith({
                where: {
                    employeeId: mockUser.employee.id,
                    date: mockCurrentDate
                },
                select: {
                    id: true,
                    checkOutTime: true
                }
            });
        });

        it('should update existing attendance with checkout time when user already checked in', async () => {
            const updatedAttendance = {
                ...mockAttendance,
                checkOutTime: mockCurrentDate
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.attendance.findFirst as jest.Mock).mockResolvedValue(mockAttendance);
            (prismaService.attendance.update as jest.Mock).mockResolvedValue(updatedAttendance);

            const result = await service.createAttendance(mockUser);

            expect(result).toEqual(updatedAttendance);
            expect(prismaService.attendance.update).toHaveBeenCalledWith({
                where: {
                    id: mockAttendance.id
                },
                data: {
                    checkOutTime: mockCurrentDate,
                }
            });
        });

        it('should create new attendance when user has not checked in yet', async () => {
            const newAttendance = {
                ...mockAttendance,
                checkInTime: mockCurrentDate
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.attendance.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.attendance.create as jest.Mock).mockResolvedValue(newAttendance);

            const result = await service.createAttendance(mockUser);

            expect(result).toEqual(newAttendance);
            expect(prismaService.attendance.create).toHaveBeenCalledWith({
                data: {
                    attendancePeriodId: mockAttendancePeriod.id,
                    employeeId: mockUser.employee.id,
                    date: mockCurrentDate,
                    checkInTime: mockCurrentDate,
                    isPresent: true,
                    createdBy: mockUser.employee.id || mockUser.id,
                }
            });
        });

        it('should handle attendance period query correctly', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.attendance.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.attendance.create as jest.Mock).mockResolvedValue(mockAttendance);

            await service.createAttendance(mockUser);

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

        it('should handle different time scenarios for check-in and check-out', async () => {
            const morningDate = new Date('2024-01-15T08:00:00Z');
            (utils.getIndonesiaDate as jest.Mock).mockReturnValue(morningDate);

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.attendance.findFirst as jest.Mock).mockResolvedValue(null);
            (prismaService.attendance.create as jest.Mock).mockResolvedValue({
                ...mockAttendance,
                checkInTime: morningDate
            });

            const result = await service.createAttendance(mockUser);

            expect(prismaService.attendance.create).toHaveBeenCalledWith({
                data: {
                    attendancePeriodId: mockAttendancePeriod.id,
                    employeeId: mockUser.employee.id,
                    date: morningDate,
                    checkInTime: morningDate,
                    isPresent: true,
                    createdBy: mockUser.employee.id || mockUser.id,
                }
            });
        });

        it('should handle user without employee relation gracefully', async () => {
            const userWithoutEmployee = {
                id: '1',
                username: 'testuser',
                employee: null
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);

            await expect(service.createAttendance(userWithoutEmployee)).rejects.toThrow();
        });

        it('should verify attendance query parameters', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.attendance.findFirst as jest.Mock).mockResolvedValue(mockAttendance);
            (prismaService.attendance.update as jest.Mock).mockResolvedValue({
                ...mockAttendance,
                checkOutTime: mockCurrentDate
            });

            await service.createAttendance(mockUser);

            expect(prismaService.attendance.findFirst).toHaveBeenCalledWith({
                where: {
                    employeeId: mockUser.employee.id,
                    date: mockCurrentDate
                },
                select: {
                    id: true,
                    checkOutTime: true
                }
            });
        });
    });
});