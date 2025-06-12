import { Body, Controller, Post, UseGuards } from '@nestjs/common';
// import { AdminGuard } from '../auth/guards/admin.guard';
import { CreatedResponseDto } from 'src/utils/dto/response.dto';
import { GetUser } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReimbursementDto } from './dto/reimbursements.dto';
import { ReimbursementsService } from './service';

@Controller('reimbursements')
@UseGuards(JwtAuthGuard)
export class ReimbursementsController {
    constructor(private readonly reimbursementsService: ReimbursementsService) { }
    @Post()

    async createReimbursement(@GetUser() user: any, @Body() body: CreateReimbursementDto) {
        const result = await this.reimbursementsService.createReimbursement(user, body);
        return new CreatedResponseDto('Reimbursement created successfully', result);
    }
}