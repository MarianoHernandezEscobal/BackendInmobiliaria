import { ApiProperty } from '@nestjs/swagger';
import { PropertyDto } from '@property/dto/property.dto';
import { RentDTO } from '@rent/dto/rent.dto';
import { PropertyEntity } from '@src/database/property/property.entity';
import { RentEntity } from '@src/database/rents/rents.entity';
import { IsString, IsEmail, MinLength } from 'class-validator';


export class User {
    @ApiProperty({ description: 'ID del usuario', example: 1 })
    id: number;

    @ApiProperty({ description: 'Nombre del usuario', example: 'John' })
    @IsString()
    @MinLength(3)
    firstName: string;

    @ApiProperty({ description: 'Correo electrónico del usuario', example: 'john@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'password123', writeOnly: true })
    @IsString()
    password: string;

    @ApiProperty({ description: 'Telefono del usuario', example: '95376123' })
    @IsString()
    phone: string;

    @ApiProperty({ description: 'Apellido del usuario', example: 'Doe' })
    @IsString()
    @MinLength(3)
    lastName: string;

    @ApiProperty({ description: 'Indica si el usuario está activo', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Propiedades favoritas del usuario' })
    favoriteProperties: PropertyEntity[];

    @ApiProperty({ description: 'Propiedades creadas por el usuario' })
    propertiesCreated: PropertyEntity[];

    @ApiProperty({ description: 'Alquileres del usuario' })
    rents: RentEntity[];

    @ApiProperty({ description: 'Indica si el usuario es administrador', example: false })
    admin: boolean;

    constructor(firstName: string, email: string, password: string, lastName: string, isActive: boolean, phone: string) {
        this.firstName = firstName;
        this.email = email;
        this.password = password;
        this.lastName = lastName;
        this.isActive = isActive;
        this.phone = User.formatPhoneNumber(phone);
    }

    static formatPhoneNumber(phone: string): string {
        phone = phone?.replace(/[\s\-\(\)]/g, '');
        if (phone?.startsWith('+5980')) {
          phone = phone.replace('+5980', '');
        }
        if (phone?.startsWith('0')) {
          phone = phone.substring(1);
        }
        if (!phone?.startsWith('+598')) {
          phone = '+598' + phone;
        }
        return phone;
      }
   
}


