import { Body, Controller, Post, UseGuards } from '@nestjs/common';
// import { AdminGuard } from '../auth/guards/admin.guard';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatedResponseDto } from 'src/utils/dto/response.dto';
import { GetUser } from '../auth/decorators/user.decorator';
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

    async addAttendancePeriod(@GetUser() user: any, @Body() body: CreateAttendancePeriodDto) {
        const result = await this.attendancePeriodeService.createAttendancePeriod(user, body);
        return new CreatedResponseDto('Attendance period created successfully', result);
    }
}