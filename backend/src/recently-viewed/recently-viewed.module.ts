import { Module } from '@nestjs/common';
import { RecentlyViewedController } from './recently-viewed.controller';
import { RecentlyViewedService } from './recently-viewed.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [RecentlyViewedController],
    providers: [RecentlyViewedService, PrismaService],
    exports: [RecentlyViewedService],
})
export class RecentlyViewedModule { }
