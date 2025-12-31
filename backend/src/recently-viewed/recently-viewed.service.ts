import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecentlyViewedService {
    constructor(private prisma: PrismaService) { }

    /**
     * Track product view
     */
    async trackView(userId: string, productId: string) {
        // Upsert: update if exists, create if not
        await (this.prisma as any).recentlyViewed.upsert({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
            update: {
                viewedAt: new Date(),
            },
            create: {
                userId,
                productId,
                viewedAt: new Date(),
            },
        });

        // Keep only last 50 viewed items per user
        const count = await (this.prisma as any).recentlyViewed.count({
            where: { userId },
        });

        if (count > 50) {
            const oldestItems = await (this.prisma as any).recentlyViewed.findMany({
                where: { userId },
                orderBy: { viewedAt: 'asc' },
                take: count - 50,
                select: { id: true },
            });

            await (this.prisma as any).recentlyViewed.deleteMany({
                where: {
                    id: { in: oldestItems.map((item: any) => item.id) },
                },
            });
        }

        return { message: 'View tracked' };
    }

    /**
     * Get recently viewed products
     */
    async getRecentlyViewed(userId: string, limit = 20) {
        const views = await (this.prisma as any).recentlyViewed.findMany({
            where: { userId },
            orderBy: { viewedAt: 'desc' },
            take: limit,
        });

        if (views.length === 0) {
            return [];
        }

        // Fetch product details
        const productIds = views.map((v: any) => v.productId);
        const products = await this.prisma.product.findMany({
            where: {
                id: { in: productIds },
                isActive: true,
            },
            include: {
                brand: true,
                category: true,
            },
        });

        // Map products to maintain order
        const productMap = new Map(products.map((p) => [p.id, p]));
        return views
            .map((v: any) => ({
                ...productMap.get(v.productId),
                viewedAt: v.viewedAt,
            }))
            .filter((p: any) => p.id); // Filter out any not found products
    }

    /**
     * Clear recently viewed for user
     */
    async clearRecentlyViewed(userId: string) {
        await (this.prisma as any).recentlyViewed.deleteMany({
            where: { userId },
        });

        return { message: 'Recently viewed cleared' };
    }
}
