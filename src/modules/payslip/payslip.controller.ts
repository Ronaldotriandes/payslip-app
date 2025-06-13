import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetResponseDto } from 'src/utils/dto/response.dto';
import { GetUser } from '../auth/decorators/user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PayslipService } from './service';
@Controller('payslip')
@UseGuards(JwtAuthGuard)
export class PayslipController {
    constructor(private readonly payslipService: PayslipService) { }
    @Get()
    async getPayslip(@GetUser() user: any) {
        const result = await this.payslipService.getPayslipByEmployeeId(user);
        return new GetResponseDto('Payslip retrieved successfully', result);
    }

    @Get('summary')
    @UseGuards(AdminGuard)
    async getPayslipSummary(@GetUser() user: any) {
        const result = await this.payslipService.getPayslipSummary(user);
        return new GetResponseDto('Payslip retrieved successfully', result);
    }
}