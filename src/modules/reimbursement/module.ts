import { Module } from '@nestjs/common';
import { PrismaModule } from 'libs/prisma/src';
import { ReimbursementsController } from './controller';
import { ReimbursementsService } from './service';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [ReimbursementsController],
    providers: [ReimbursementsService],
    exports: [ReimbursementsService],
})
export class ReimbursementsModule { }
