import { Test, TestingModule } from '@nestjs/testing';
import { DatosSensoresController } from './datos_sensores.controller';
import { DatosSensoresService } from './datos_sensores.service';

describe('DatosSensoresController', () => {
  let controller: DatosSensoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatosSensoresController],
      providers: [DatosSensoresService],
    }).compile();

    controller = module.get<DatosSensoresController>(DatosSensoresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
