import { Module } from '@nestjs/common';
import { UserActionsService } from './user-actions.service';
import { UserActionsController } from './user-actions.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [UserActionsController],
  providers: [UserActionsService, PrismaService],
})
export class UserActionsModule { }
