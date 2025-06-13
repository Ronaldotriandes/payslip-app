import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'libs/prisma/src';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period-dto';
import { AttendancePeriodeService } from './service';

describe('AttendancePeriodeService', () => {
    let service: AttendancePeriodeService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockAttendancePeriod = {
        id: 'period-1',
        name: 'January 2024 Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        status: 'ACTIVE',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z')
    };
    const user = {
        id: 'user-1',
        employee: {
            id: 'emp-1',
            fullname: 'Test Employee'
        }
    };
    beforeEach(async () => {
        const mockPrismaService = {
            attendancePeriod: {
                findFirst: jest.fn(),
                create: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AttendancePeriodeService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<AttendancePeriodeService>(AttendancePeriodeService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createAttendancePeriod', () => {
        const validDto: CreateAttendancePeriodDto = {
            name: 'January 2024 Period',
            startDate: '2024-01-01',
            endDate: '2024-01-31'
        };

        it('should throw BadRequestException when end date is before start date', async () => {
            const invalidDto: CreateAttendancePeriodDto = {
                name: 'Invalid Period',
                startDate: '2024-01-31',
                endDate: '2024-01-01'
            };

            await expect(service.createAttendancePeriod(user, invalidDto)).rejects.toThrow(BadRequestException);
            await expect(service.createAttendancePeriod(user, invalidDto)).rejects.toThrow('End date must be after start date');

            expect(prismaService.attendancePeriod.create).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when end date equals start date', async () => {
            const invalidDto: CreateAttendancePeriodDto = {
                name: 'Same Date Period',
                startDate: '2024-01-01',
                endDate: '2024-01-01'
            };

            await expect(service.createAttendancePeriod(user, invalidDto)).rejects.toThrow(BadRequestException);
            await expect(service.createAttendancePeriod(user, invalidDto)).rejects.toThrow('End date must be after start date');
        });

        it('should create attendance period successfully when dates are valid', async () => {
            (prismaService.attendancePeriod.create as jest.Mock).mockResolvedValue(mockAttendancePeriod);

            const result = await service.createAttendancePeriod(user, validDto);

            expect(result).toEqual(mockAttendancePeriod);
            expect(prismaService.attendancePeriod.create).toHaveBeenCalledWith({
                data: {
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31'),
                    status: 'ACTIVE',
                    name: 'January 2024 Period',
                    createdBy: user.employee.id || user.id,
                },
            });
        });

        it('should handle different date formats correctly', async () => {
            const dtoWithDifferentFormat: CreateAttendancePeriodDto = {
                name: 'February 2024 Period',
                startDate: '2024-02-01T00:00:00Z',
                endDate: '2024-02-29T23:59:59Z'
            };

            const expectedPeriod = {
                ...mockAttendancePeriod,
                name: 'February 2024 Period',
                startDate: new Date('2024-02-01T00:00:00Z'),
                endDate: new Date('2024-02-29T23:59:59Z')
            };

            (prismaService.attendancePeriod.create as jest.Mock).mockResolvedValue(expectedPeriod);

            const result = await service.createAttendancePeriod(user, dtoWithDifferentFormat);

            expect(result).toEqual(expectedPeriod);
            expect(prismaService.attendancePeriod.create).toHaveBeenCalledWith({
                data: {
                    startDate: new Date('2024-02-01T00:00:00Z'),
                    endDate: new Date('2024-02-29T23:59:59Z'),
                    status: 'ACTIVE',
                    name: 'February 2024 Period',
                    createdBy: user.employee.id || user.id,
                },
            });
        });

        it('should handle database errors during creation', async () => {
            const dbError = new Error('Database connection failed');
            (prismaService.attendancePeriod.create as jest.Mock).mockRejectedValue(dbError);

            await expect(service.createAttendancePeriod(user, validDto)).rejects.toThrow('Database connection failed');
            expect(prismaService.attendancePeriod.create).toHaveBeenCalledWith({
                data: {
                    startDate: new Date('2024-01-01'),
                    endDate: new Date('2024-01-31'),
                    status: 'ACTIVE',
                    name: 'January 2024 Period',
                    createdBy: user.employee.id || user.id,
                },
            });
        });

        it('should handle Prisma unique constraint errors (P2002)', async () => {

            const prismaError = new Error('Unique constraint failed');
            (prismaError as any).code = 'P2002';
            (prismaService.attendancePeriod.create as jest.Mock).mockRejectedValue(prismaError);

            await expect(service.createAttendancePeriod(user, validDto)).rejects.toThrow('Unique constraint failed');
        });

        it('should validate date conversion correctly', async () => {
            const dtoWithStringDates: CreateAttendancePeriodDto = {
                name: 'Test Period',
                startDate: '2024-03-01',
                endDate: '2024-03-31'
            };

            (prismaService.attendancePeriod.create as jest.Mock).mockResolvedValue({
                ...mockAttendancePeriod,
                startDate: new Date('2024-03-01'),
                endDate: new Date('2024-03-31')
            });

            await service.createAttendancePeriod(user, dtoWithStringDates);

            expect(prismaService.attendancePeriod.create).toHaveBeenCalledWith({
                data: {
                    startDate: new Date('2024-03-01'),
                    endDate: new Date('2024-03-31'),
                    status: 'ACTIVE',
                    name: 'Test Period',
                    createdBy: user.employee.id || user.id,
                },
            });
        });

        it('should handle edge case with minimal time difference', async () => {
            const dtoWithMinimalDifference: CreateAttendancePeriodDto = {
                name: 'Short Period',
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-01-01T00:00:01Z'
            };

            (prismaService.attendancePeriod.create as jest.Mock).mockResolvedValue({
                ...mockAttendancePeriod,
                name: 'Short Period',
                startDate: new Date('2024-01-01T00:00:00Z'),
                endDate: new Date('2024-01-01T00:00:01Z')
            });

            const result = await service.createAttendancePeriod(user, dtoWithMinimalDifference);

            expect(result).toBeDefined();
            expect(prismaService.attendancePeriod.create).toHaveBeenCalled();
        });



        it('should set status to ACTIVE by default', async () => {
            (prismaService.attendancePeriod.create as jest.Mock).mockResolvedValue(mockAttendancePeriod);

            await service.createAttendancePeriod(user, validDto);

            expect(prismaService.attendancePeriod.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    status: 'ACTIVE'
                }),
            });
        });

        it('should handle long period names', async () => {
            const longName = 'A'.repeat(255);
            const dtoWithLongName: CreateAttendancePeriodDto = {
                name: longName,
                startDate: '2024-01-01',
                endDate: '2024-01-31'
            };

            (prismaService.attendancePeriod.create as jest.Mock).mockResolvedValue({
                ...mockAttendancePeriod,
                name: longName
            });

            const result = await service.createAttendancePeriod(user, dtoWithLongName);

            expect(result.name).toBe(longName);
            expect(prismaService.attendancePeriod.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    name: longName
                }),
            });
        });
    });
});