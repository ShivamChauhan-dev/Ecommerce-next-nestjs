import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [AdminController, AdminUsersController],
    providers: [AdminService, AdminUsersService, PrismaService],
    exports: [AdminService, AdminUsersService],
})
export class AdminModule { }

