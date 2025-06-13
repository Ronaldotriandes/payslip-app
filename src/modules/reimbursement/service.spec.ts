import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'libs/prisma/src';
import * as utils from 'src/utils';
import { CreateReimbursementDto } from './dto/reimbursements.dto';
import { ReimbursementsService } from './service';

jest.mock('src/utils', () => ({
    getIndonesiaDate: jest.fn(),
}));

describe('ReimbursementsService', () => {
    let service: ReimbursementsService;
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

    const mockReimbursement = {
        id: 'reimb-1',
        employeeId: 'emp-1',
        attendancePeriodId: 'period-1',
        amount: 150000,
        description: 'Transportation expense',
        createdBy: 'emp-1',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
    };

    beforeEach(async () => {
        const mockPrismaService = {
            attendancePeriod: {
                findFirst: jest.fn(),
            },
            reimbursement: {
                create: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReimbursementsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<ReimbursementsService>(ReimbursementsService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createReimbursement', () => {
        const mockCurrentDate = new Date('2024-01-15T10:00:00Z');
        const validReimbursementDto: CreateReimbursementDto = {
            amount: 150000,
            description: 'Transportation expense for client meeting'
        };

        beforeEach(() => {
            (utils.getIndonesiaDate as jest.Mock).mockReturnValue(mockCurrentDate);
        });

        it('should throw ConflictException when no active attendance period exists', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.createReimbursement(mockUser, validReimbursementDto)).rejects.toThrow(ConflictException);
            await expect(service.createReimbursement(mockUser, validReimbursementDto)).rejects.toThrow('An attendance period already exists for the current date');

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

        it('should create reimbursement successfully when attendance period exists', async () => {
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockResolvedValue(mockReimbursement);

            const result = await service.createReimbursement(mockUser, validReimbursementDto);

            expect(result).toEqual(mockReimbursement);
            expect(prismaService.reimbursement.create).toHaveBeenCalledWith({
                data: {
                    attendancePeriodId: mockAttendancePeriod.id,
                    employeeId: mockUser.employee.id,
                    amount: validReimbursementDto.amount,
                    description: validReimbursementDto.description,
                    createdBy: mockUser.employee.id,
                }
            });
        });



        it('should handle different reimbursement amounts correctly', async () => {
            const testCases = [
                { amount: 50000, description: 'Parking fee' },
                { amount: 250000, description: 'Fuel expense' },
                { amount: 1000000, description: 'Hotel accommodation' },
                { amount: 25000, description: 'Toll road fee' }
            ];

            for (const testCase of testCases) {
                (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
                (prismaService.reimbursement.create as jest.Mock).mockResolvedValue({
                    ...mockReimbursement,
                    amount: testCase.amount,
                    description: testCase.description
                });

                await service.createReimbursement(mockUser, testCase);

                expect(prismaService.reimbursement.create).toHaveBeenCalledWith({
                    data: {
                        attendancePeriodId: mockAttendancePeriod.id,
                        employeeId: mockUser.employee.id,
                        amount: testCase.amount,
                        description: testCase.description,
                        createdBy: mockUser.employee.id,
                    }
                });

                jest.clearAllMocks();
                (utils.getIndonesiaDate as jest.Mock).mockReturnValue(mockCurrentDate);
            }
        });

        it('should handle empty description', async () => {
            const reimbursementWithEmptyDescription: CreateReimbursementDto = {
                amount: 100000,
                description: ''
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockResolvedValue({
                ...mockReimbursement,
                description: ''
            });

            const result = await service.createReimbursement(mockUser, reimbursementWithEmptyDescription);

            expect(result.description).toBe('');
            expect(prismaService.reimbursement.create).toHaveBeenCalledWith({
                data: {
                    attendancePeriodId: mockAttendancePeriod.id,
                    employeeId: mockUser.employee.id,
                    amount: 100000,
                    description: '',
                    createdBy: mockUser.employee.id,
                }
            });
        });

        it('should handle long description', async () => {
            const longDescription = 'Transportation expense for business trip to Jakarta including taxi fare from airport to hotel, hotel to client office, client office to restaurant for business lunch, restaurant back to hotel, and hotel to airport for return flight. Total distance covered approximately 150 kilometers.';
            const reimbursementWithLongDescription: CreateReimbursementDto = {
                amount: 500000,
                description: longDescription
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockResolvedValue({
                ...mockReimbursement,
                description: longDescription
            });

            const result = await service.createReimbursement(mockUser, reimbursementWithLongDescription);

            expect(result.description).toBe(longDescription);
        });

        it('should handle zero amount reimbursement', async () => {
            const zeroAmountReimbursement: CreateReimbursementDto = {
                amount: 0,
                description: 'No expense incurred'
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockResolvedValue({
                ...mockReimbursement,
                amount: 0,
                description: 'No expense incurred'
            });

            const result = await service.createReimbursement(mockUser, zeroAmountReimbursement);

            expect(result.amount).toBe(0);
            expect(prismaService.reimbursement.create).toHaveBeenCalledWith({
                data: {
                    attendancePeriodId: mockAttendancePeriod.id,
                    employeeId: mockUser.employee.id,
                    amount: 0,
                    description: 'No expense incurred',
                    createdBy: mockUser.employee.id,
                }
            });
        });

        it('should handle negative amount reimbursement', async () => {
            const negativeAmountReimbursement: CreateReimbursementDto = {
                amount: -50000,
                description: 'Refund to company'
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockResolvedValue({
                ...mockReimbursement,
                amount: -50000,
                description: 'Refund to company'
            });

            const result = await service.createReimbursement(mockUser, negativeAmountReimbursement);

            expect(result.amount).toBe(-50000);
        });

        it('should handle large amount reimbursement', async () => {
            const largeAmountReimbursement: CreateReimbursementDto = {
                amount: 10000000,
                description: 'International business trip expenses'
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockResolvedValue({
                ...mockReimbursement,
                amount: 10000000,
                description: 'International business trip expenses'
            });

            const result = await service.createReimbursement(mockUser, largeAmountReimbursement);

            expect(result.amount).toBe(10000000);
        });

        it('should handle decimal amount reimbursement', async () => {
            const decimalAmountReimbursement: CreateReimbursementDto = {
                amount: 125.50,
                description: 'Parking meter fee'
            };

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockResolvedValue({
                ...mockReimbursement,
                amount: 125.50,
                description: 'Parking meter fee'
            });

            const result = await service.createReimbursement(mockUser, decimalAmountReimbursement);

            expect(result.amount).toBe(125.50);
        });

        it('should verify attendance period query with correct date range', async () => {
            const specificDate = new Date('2024-06-15T14:30:00Z');
            (utils.getIndonesiaDate as jest.Mock).mockReturnValue(specificDate);

            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockResolvedValue(mockReimbursement);

            await service.createReimbursement(mockUser, validReimbursementDto);

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

        it('should handle database errors during creation', async () => {
            const dbError = new Error('Database connection failed');
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockResolvedValue(mockAttendancePeriod);
            (prismaService.reimbursement.create as jest.Mock).mockRejectedValue(dbError);

            await expect(service.createReimbursement(mockUser, validReimbursementDto)).rejects.toThrow('Database connection failed');
        });

        it('should handle database errors during attendance period lookup', async () => {
            const dbError = new Error('Database query failed');
            (prismaService.attendancePeriod.findFirst as jest.Mock).mockRejectedValue(dbError);

            await expect(service.createReimbursement(mockUser, validReimbursementDto)).rejects.toThrow('Database query failed');
        });
    })
})