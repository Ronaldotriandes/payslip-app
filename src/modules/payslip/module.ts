import { Module } from '@nestjs/common';
import { PrismaModule } from 'libs/prisma/src';
import { PayrollController } from './controller';
import { PayslipController } from './payslip.controller';
import { PayslipService } from './service';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [PayrollController, PayslipController],
    providers: [PayslipService],
    exports: [PayslipService],
})
export class PayslipModule { }
