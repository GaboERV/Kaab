import { ApiProperty } from '@nestjs/swagger';

export class ParametrosBusqueda {
  @ApiProperty({ type: String, description: 'ID de la colmena' })
  colmenaId: string;

  @ApiProperty({ type: String, description: 'Tiempo de búsqueda (por ejemplo: "1h", "30m","6d","1w")', required: false })
  tiempoBusqueda?: string;

  @ApiProperty({ type: String, description: 'Intervalo de tiempo entre datos promediados (por ejemplo: "minuto", "hora", "día","semana", "mes")' })
  intervalo: string;
}