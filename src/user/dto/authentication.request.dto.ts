import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class AuthenticationRequestDto {
    @ApiProperty({ description: 'Correo electrónico del usuario', example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'password123', writeOnly: true })
    @IsString()
    password: string;
}