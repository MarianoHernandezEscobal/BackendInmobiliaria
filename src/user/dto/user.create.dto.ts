import { IsString, MinLength, IsEmail } from "class-validator";

export class CreateUser {
    @IsString()
    @MinLength(3)
    firstName: string;

    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsString()
    phone: string;

    @IsString()
    @MinLength(3)
    lastName: string;
}