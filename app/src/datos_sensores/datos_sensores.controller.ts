import { Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DatosSensoresService } from './datos_sensores.service';
import { ParametrosBusqueda } from './dto/Parametros_busqueda.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('Datos Colmenas')
@Controller('datos-colmenas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth() // Asegura que las rutas requieran autenticación JWT
export class DatosSensoresController {
  constructor(private readonly datosSensoresService: DatosSensoresService) {}

  @Get('historico-colmena')
  @ApiOperation({ summary: 'Obtener histórico de una colmena' })
  @ApiResponse({ status: 200, description: 'Histórico obtenido correctamente.' })
  async obtenerHistoricoColmena(
    @Query(new ValidationPipe()) parametrosBusqueda: ParametrosBusqueda
  ) {
    return this.datosSensoresService.obtenerHistoricoColmena(parametrosBusqueda);
  }

  @Get('ultimo-dato-colmenas')
  @ApiOperation({ summary: 'Obtener último dato de todas las colmenas' })
  @ApiResponse({ status: 200, description: 'Datos obtenidos correctamente.' })
  async obtenerColmenasData() {
    return this.datosSensoresService.getAllColmenasData();
  }
}
