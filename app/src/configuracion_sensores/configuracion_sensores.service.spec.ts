import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionSensoresService } from './configuracion_sensores.service';

describe('ConfiguracionSensoresService', () => {
  let service: ConfiguracionSensoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfiguracionSensoresService],
    }).compile();

    service = module.get<ConfiguracionSensoresService>(ConfiguracionSensoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
