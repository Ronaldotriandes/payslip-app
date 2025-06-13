import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePayrollDto {

    @IsNotEmpty()
    @IsString()
    attendancePeriodId: string;



}

