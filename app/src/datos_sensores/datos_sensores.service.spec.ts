import { Test, TestingModule } from '@nestjs/testing';
import { DatosSensoresService } from './datos_sensores.service';

describe('DatosSensoresService', () => {
  let service: DatosSensoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatosSensoresService],
    }).compile();

    service = module.get<DatosSensoresService>(DatosSensoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
