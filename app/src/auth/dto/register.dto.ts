import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        description: 'Correo electrónico del usuario',
        example: 'usuario@ejemplo.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Contraseña del usuario (mínimo 6 caracteres)',
        example: 'password123',
    })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({
        description: 'Campo alternativo para contraseña (mínimo 6 caracteres)',
        example: 'contrasena123',
    })
    @IsString()
    @MinLength(6)
    contrasena: string;
}
