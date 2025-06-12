import { Module } from '@nestjs/common';
import { PrismaModule } from 'libs/prisma/src';
import { AttendanceController } from './controller';
import { AttendanceService } from './service';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [AttendanceController],
    providers: [AttendanceService],
    exports: [AttendanceService],
})
export class AttendanceModule { }
