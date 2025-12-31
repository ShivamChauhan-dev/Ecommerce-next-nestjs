import {
    Controller,
    Get,
    Put,
    Delete,
    Param,
    Query,
    Body,
    UseGuards,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
    constructor(private readonly adminUsersService: AdminUsersService) { }

    /**
     * Get all users with pagination
     * GET /admin/users
     */
    @Get()
    async getUsers(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('role') role?: string,
    ) {
        return this.adminUsersService.getUsers({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            search,
            role,
        });
    }

    /**
     * Get user stats
     * GET /admin/users/stats
     */
    @Get('stats')
    async getUserStats() {
        return this.adminUsersService.getUserStats();
    }

    /**
     * Get single user
     * GET /admin/users/:id
     */
    @Get(':id')
    async getUser(@Param('id') id: string) {
        return this.adminUsersService.getUserById(id);
    }

    /**
     * Update user role
     * PUT /admin/users/:id/role
     */
    @Put(':id/role')
    async updateUserRole(
        @Param('id') id: string,
        @Body('role') role: 'USER' | 'ADMIN',
    ) {
        return this.adminUsersService.updateUserRole(id, role);
    }

    /**
     * Update user details
     * PUT /admin/users/:id
     */
    @Put(':id')
    async updateUser(
        @Param('id') id: string,
        @Body() body: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            emailVerified?: boolean;
        },
    ) {
        return this.adminUsersService.updateUser(id, body);
    }

    /**
     * Deactivate user
     * PUT /admin/users/:id/deactivate
     */
    @Put(':id/deactivate')
    async deactivateUser(@Param('id') id: string) {
        return this.adminUsersService.deactivateUser(id);
    }

    /**
     * Delete user
     * DELETE /admin/users/:id
     */
    @Delete(':id')
    async deleteUser(@Param('id') id: string) {
        return this.adminUsersService.deleteUser(id);
    }
}
