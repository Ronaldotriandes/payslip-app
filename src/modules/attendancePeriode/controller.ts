import { Body, Controller, Post, UseGuards } from '@nestjs/common';
// import { AdminGuard } from '../auth/guards/admin.guard';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatedResponseDto } from 'src/utils/dto/response.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period-dto';
import { AttendancePeriodeService } from './service';

@Controller('attendance-periode')
@UseGuards(JwtAuthGuard)
export class AttendancePeriodeController {
    constructor(private readonly attendancePeriodeService: AttendancePeriodeService) { }
    @Post()
    @UseGuards(AdminGuard)

    async addAttendancePeriod(@Body() body: CreateAttendancePeriodDto) {
        const result = await this.attendancePeriodeService.createAttendancePeriod(body);
        return new CreatedResponseDto('Attendance period created successfully', result);
    }
}