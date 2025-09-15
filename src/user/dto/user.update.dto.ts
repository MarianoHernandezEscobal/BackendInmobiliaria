import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UserUpdateDto {
    @ApiProperty({ description: 'Nombre del usuario', example: 'John' })
    @IsString()
    @MinLength(3)
    firstName: string;

    @ApiProperty({ description: 'Telefono del usuario', example: '95376123' })
    @IsString()
    phone: string;

    @ApiProperty({ description: 'Apellido del usuario', example: 'Doe' })
    @IsString()
    @MinLength(3)
    lastName: string;

    constructor(firstName: string, phone: string, lastName: string) {
        this.firstName = firstName;
        this.phone = phone;
        this.lastName = lastName;
    }
}
