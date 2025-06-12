import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateReimbursementDto {

    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsString()
    description: string;



}

