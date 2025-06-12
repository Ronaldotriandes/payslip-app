import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateAttendancePeriodDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsDateString()
    startDate: string;

    @IsNotEmpty()
    @IsDateString()
    endDate: string;


    toDto(): CreateAttendancePeriode {
        return {
            name: this.name,
            startDate: this.startDate,
            endDate: this.endDate,
        };
    }

}

export class CreateAttendancePeriode {
    startDate: string;
    endDate: string;
    name: string
}
