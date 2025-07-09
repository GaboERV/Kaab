import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from "class-validator"
import { Role } from "../../types/user.types"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

/**
 * DTO (Data Transfer Object) para la creación de un nuevo usuario.
 * Define la estructura de los datos esperados en la solicitud para crear un usuario,
 * incluyendo validaciones y metadatos para Swagger/OpenAPI.
 */
export class CreateUserDto {
  /**
   * Dirección de correo electrónico del usuario.
   */
  @ApiProperty({
    description: "Dirección de correo electrónico del usuario",
    example: "usuario@example.com",
  })
  @IsEmail()
  email: string

  /**
   * Contraseña del usuario.
   */
  @ApiProperty({
    description: "Contraseña del usuario",
    minLength: 6,
    example: "contraseña123",
  })
  @IsString()
  @MinLength(6)
  password: string


}
