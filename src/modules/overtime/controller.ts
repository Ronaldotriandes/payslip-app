import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreatedResponseDto } from 'src/utils/dto/response.dto';
import { GetUser } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOvertimeDto } from './dto/create-overtime.dto';
import { OvertimeService } from './service';

@Controller('overtime')
@UseGuards(JwtAuthGuard)
export class OvertimeController {
    constructor(private readonly overtimeService: OvertimeService) { }
    @Post()

    async addOvertime(@GetUser() user: any, @Body() body: CreateOvertimeDto) {
        const result = await this.overtimeService.createOvertime(user, body);
        return new CreatedResponseDto('Attendance period created successfully', result);
    }
}