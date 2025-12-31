import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminUsersService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all users with pagination and search
     */
    async getUsers(params: {
        page?: number;
        limit?: number;
        search?: string;
        role?: string;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (params.search) {
            where.OR = [
                { email: { contains: params.search, mode: 'insensitive' } },
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        if (params.role) {
            where.role = params.role;
        }

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    avatar: true,
                    emailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { orders: true, reviews: true },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get single user with full details
     */
    async getUserById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                address: true,
                orders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                reviews: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: { orders: true, reviews: true },
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Remove sensitive fields
        const { password, refreshToken, resetToken, ...result } = user as any;
        return result;
    }

    /**
     * Update user role
     */
    async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });
    }

    /**
     * Update user details (admin)
     */
    async updateUser(
        userId: string,
        data: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            emailVerified?: boolean;
        },
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                emailVerified: true,
                role: true,
            },
        });
    }

    /**
     * Deactivate user (soft delete by clearing password)
     */
    async deactivateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Prevent deactivating admins
        if (user.role === 'ADMIN') {
            throw new BadRequestException('Cannot deactivate admin users');
        }

        // Clear all tokens to log out user
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshToken: null,
                password: null, // Prevents login
            },
        });

        return { message: 'User deactivated successfully' };
    }

    /**
     * Delete user permanently
     */
    async deleteUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role === 'ADMIN') {
            throw new BadRequestException('Cannot delete admin users');
        }

        // Delete user and related data
        await this.prisma.$transaction([
            // Delete related data first
            (this.prisma as any).cart?.deleteMany({ where: { userId } }),
            (this.prisma as any).wishlist?.deleteMany({ where: { userId } }),
            (this.prisma as any).compareList?.deleteMany({ where: { userId } }),
            (this.prisma as any).recentlyViewed?.deleteMany({ where: { userId } }),
            (this.prisma as any).notification?.deleteMany({ where: { userId } }),
            // Then delete user
            this.prisma.user.delete({ where: { id: userId } }),
        ].filter(Boolean));

        return { message: 'User deleted successfully' };
    }

    /**
     * Get user stats
     */
    async getUserStats() {
        const [total, admins, verified, newThisMonth] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { role: 'ADMIN' } }),
            this.prisma.user.count({ where: { emailVerified: true } }),
            this.prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setDate(1)), // First of current month
                    },
                },
            }),
        ]);

        return {
            total,
            admins,
            regularUsers: total - admins,
            verified,
            unverified: total - verified,
            newThisMonth,
        };
    }
}
