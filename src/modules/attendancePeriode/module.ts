import { Module } from '@nestjs/common';
import { PrismaModule } from 'libs/prisma/src';
import { AttendancePeriodeController } from './controller';
import { AttendancePeriodeService } from './service';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [AttendancePeriodeController],
    providers: [AttendancePeriodeService],
    exports: [AttendancePeriodeService],
})
export class AttendancePeriodeModule { }
