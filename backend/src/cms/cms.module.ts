import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import { CmsController } from './cms.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CmsController],
  providers: [CmsService, PrismaService],
})
export class CmsModule { }
