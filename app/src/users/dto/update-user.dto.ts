import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {

    @ApiProperty({ description: 'Nuevo correo electrónico del usuario', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;


    @ApiProperty({ description: 'Nueva contraseña del usuario', required: false })
    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

}