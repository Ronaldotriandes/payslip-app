import { Body, Controller, Post, UseGuards } from '@nestjs/common';
// import { AdminGuard } from '../auth/guards/admin.guard';
import { CreatedResponseDto } from 'src/utils/dto/response.dto';
import { GetUser } from '../auth/decorators/user.decorator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePayrollDto } from './dto/create-payroll.dto';
import { PayslipService } from './service';
@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
    constructor(private readonly payslipService: PayslipService) { }
    @Post()
    @UseGuards(AdminGuard)
    async createPayroll(@GetUser() user: any, @Body() body: CreatePayrollDto) {
        const result = await this.payslipService.createPayroll(user, body);
        return new CreatedResponseDto('Payroll created successfully', result);
    }
}