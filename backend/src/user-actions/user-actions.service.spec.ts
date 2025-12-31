import { Test, TestingModule } from '@nestjs/testing';
import { UserActionsService } from './user-actions.service';

describe('UserActionsService', () => {
  let service: UserActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserActionsService],
    }).compile();

    service = module.get<UserActionsService>(UserActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
