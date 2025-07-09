import { Test, TestingModule } from '@nestjs/testing';
import { ConfiguracionSensoresController } from './configuracion_sensores.controller';
import { ConfiguracionSensoresService } from './configuracion_sensores.service';

describe('ConfiguracionSensoresController', () => {
  let controller: ConfiguracionSensoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfiguracionSensoresController],
      providers: [ConfiguracionSensoresService],
    }).compile();

    controller = module.get<ConfiguracionSensoresController>(ConfiguracionSensoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
