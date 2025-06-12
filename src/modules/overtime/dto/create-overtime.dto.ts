import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Max } from 'class-validator';

export class CreateOvertimeDto {

    @IsNotEmpty()
    @IsNumber()
    @Max(3, { message: 'Overtime hours cannot exceed 3 hours' })
    hours: number;

    @IsNotEmpty()
    @IsDateString()
    date: string;

    @IsOptional()
    @IsString()
    description: string;



}

export class CreateAttendancePeriode {
    startDate: string;
    endDate: string;
    name: string
}
