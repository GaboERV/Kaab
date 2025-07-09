import { ApiProperty } from '@nestjs/swagger';

class ParametrosDto {
    @ApiProperty({ example: 40, description: 'Temperatura máxima permitida' })
    temp_max: number;

    @ApiProperty({ example: 10, description: 'Temperatura mínima permitida' })
    temp_min: number;

    @ApiProperty({ example: 90, description: 'Humedad máxima permitida' })
    humedad_max: number;

    @ApiProperty({ example: 20, description: 'Humedad mínima permitida' })
    humedad_min: number;

    @ApiProperty({ example: 1100, description: 'Presión máxima permitida' })
    presion_max: number;

    @ApiProperty({ example: 900, description: 'Presión mínima permitida' })
    presion_min: number;

    @ApiProperty({ example: 100, description: 'Peso máximo permitido' })
    peso_max: number;
}

export class CreateConfiguracionSensoreDto {
    @ApiProperty({ example: 'Sensor de temperatura', description: 'Nombre de la configuración del sensor' })
    nombre: string;

    @ApiProperty({ type: ParametrosDto, description: 'Parámetros de configuración del sensor' })
    parametros: ParametrosDto;

    @ApiProperty({ example: 'Configuración para sensores en el almacén', description: 'Descripción de la configuración' })
    descripcion: string;
}
