import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'libs/prisma/src';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

interface User {
    id: string;
    username: string;
    employee: any | null;
    password: string;
    role: string;
}

@Injectable()
export class AuthService {

    constructor(
        private jwtService: JwtService,
        private prismaService: PrismaService,
    ) { }


    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = {
            id: user.id,
            username: user.username,
            employee: user.employee,
            sub: user.id, role: user.role
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                fullname: user.employee?.fullname || 'admin',
                role: user.role
            }
        };
    }

    async validateUser(username: string, password: string): Promise<User | null> {
        try {

            const datauser = await this.prismaService.user.findFirst({
                where: {
                    username: username,

                },
                select: {
                    id: true,
                    username: true,
                    password: true,
                    role: true,
                    employee: {
                        select: {
                            fullname: true,
                            id: true,

                        }
                    }
                }
            });

            if (datauser && await bcrypt.compare(password, datauser.password)) {
                return {
                    id: datauser.id,
                    username: datauser.username,
                    password: datauser.password,
                    role: datauser.role,
                    employee: datauser.employee || null
                };
            }
            return null;
        } catch (error) {
            console.log(error)
            return null

        }
    }

    async validateUserById(id: string): Promise<User | null> {
        const user = await this.prismaService.user.findUnique({
            where: {
                id: id,
            },
            select: {
                id: true,
                username: true,
                password: true,
                role: true,
                employee: {
                    select: {
                        fullname: true,
                        id: true
                    }
                }
            }
        });
        if (user) {
            return {
                id: user.id,
                username: user.username,
                password: user.password,
                role: user.role,
                employee: user.employee
            }
        }
        return null;
    }
}