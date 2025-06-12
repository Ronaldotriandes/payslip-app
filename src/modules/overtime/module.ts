import { Module } from '@nestjs/common';
import { PrismaModule } from 'libs/prisma/src';
import { OvertimeController } from './controller';
import { OvertimeService } from './service';

@Module({
    imports: [
        PrismaModule,
    ],
    controllers: [OvertimeController],
    providers: [OvertimeService],
    exports: [OvertimeService],
})
export class OvertimeModule { }
