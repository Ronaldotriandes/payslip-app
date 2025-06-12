import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from 'libs/prisma/src';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceModule } from './modules/attendance/module';
import { AttendancePeriodeModule } from './modules/attendancePeriode/module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { OvertimeModule } from './modules/overtime/module';
import { ReimbursementsModule } from './modules/reimbursement/module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuthModule,
    AttendancePeriodeModule,
    AttendanceModule,
    OvertimeModule,
    ReimbursementsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
