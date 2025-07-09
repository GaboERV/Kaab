import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ConfiguracionSensoresService } from './configuracion_sensores.service';
import { CreateConfiguracionSensoreDto } from './dto/create-configuracion_sensore.dto';
import { UpdateConfiguracionSensoreDto } from './dto/update-configuracion_sensore.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('configuracion-colmenas')
@Controller('configuracion-colmenas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth() // Asegura que las rutas requieran autenticación JWT
export class ConfiguracionSensoresController {
  constructor(private readonly configuracionSensoresService: ConfiguracionSensoresService) {}

  @ApiOperation({ summary: 'Obtener configuración de colmena por ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID de la configuración de la colmena' })
  @ApiResponse({ status: 200, description: 'Configuración encontrada.' })
  @Get(':id')
  async get(@Param('id') id: string) {
    console.log(`Controller: Received ID = ${id}`);
    return this.configuracionSensoresService.get(id);
  }

  @ApiOperation({ summary: 'Actualizar configuración de colmenas' })
  @ApiParam({ name: 'id', type: String, description: 'ID de la configuración de la colmena' })
  @ApiBody({ type: UpdateConfiguracionSensoreDto })
  @ApiResponse({ status: 200, description: 'Configuración actualizada.' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConfiguracionSensoreDto: UpdateConfiguracionSensoreDto,
  ) {
    return this.configuracionSensoresService.update(id, updateConfiguracionSensoreDto);
  }
  @ApiOperation({ summary: 'Obtener todas las configuraciones de colmenas' })
  @ApiResponse({ status: 200, description: 'Lista de configuraciones obtenida correctamente.' })
  @Get()
  async getAll() {
    return this.configuracionSensoresService.getAll();
  }
}
