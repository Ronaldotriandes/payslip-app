import { Controller, Patch, UseGuards } from '@nestjs/common';
import { CreatedResponseDto } from 'src/utils/dto/response.dto';
import { GetUser } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttendanceService } from './service';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }
    @Patch()

    async addAttendance(@GetUser() user: any) {
        const result = await this.attendanceService.createAttendance(user);
        return new CreatedResponseDto('Attendance successfully', result);
    }
}