import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ResponseDto } from 'src/utils/dto/response.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }


    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<ResponseDto> {
        const result = await this.authService.login(loginDto);
        return new ResponseDto('Login successful', result);
    }
}