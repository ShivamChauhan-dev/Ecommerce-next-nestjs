import { Test, TestingModule } from '@nestjs/testing';
import { UserActionsController } from './user-actions.controller';

describe('UserActionsController', () => {
  let controller: UserActionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserActionsController],
    }).compile();

    controller = module.get<UserActionsController>(UserActionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
