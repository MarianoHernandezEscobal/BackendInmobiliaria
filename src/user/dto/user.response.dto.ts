import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.dto';
import { UserEntity } from '@src/database/user/user.entity';

export class UserResponseDto {
    @ApiProperty({ description: 'ID del usuario', example: 1 })
    id: number;

    @ApiProperty({ description: 'Nombre del usuario', example: 'John' })
    firstName: string;

    @ApiProperty({ description: 'Correo electrónico del usuario', example: 'john@example.com' })
    email: string;

    @ApiProperty({ description: 'Apellido del usuario', example: 'Doe' })
    lastName: string;

    @ApiProperty({ description: 'Indica si el usuario está activo', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Indica si el usuario es administrador', example: false })
    admin: boolean;

    @ApiProperty({ description: 'Indica si el usuario es administrador', example: false })
    phone: string;

    @ApiProperty({ description: 'Fecha de creación del usuario', example: '2023-01-01T00:00:00Z' })
    createdAt: Date;

    constructor(user: UserEntity) {
        this.firstName = user.firstName;
        this.email = user.email;
        this.phone = user.phone;
        this.lastName = user.lastName;
        this.isActive = user.isActive;
        this.admin = user.admin;
        this.createdAt = user.createdAt;
    }
}
