import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecommendationsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get similar products (by category and brand)
     */
    async getSimilarProducts(productId: string, limit = 8) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return [];
        }

        const similarProducts = await this.prisma.product.findMany({
            where: {
                id: { not: productId },
                isActive: true,
                OR: [
                    { categoryId: product.categoryId },
                    { brandId: product.brandId },
                ],
            },
            take: limit,
            orderBy: [
                { sold: 'desc' },
                { rating: 'desc' },
            ],
            include: {
                brand: true,
                category: true,
            },
        });

        return similarProducts;
    }

    /**
     * Get personalized recommendations for user
     */
    async getPersonalizedRecommendations(userId: string, limit = 12) {
        // Get user's order history
        const orders = await this.prisma.order.findMany({
            where: { userId },
            select: { items: true },
        });

        // Extract categories and brands from purchased items
        const purchasedCategories = new Set<string>();
        const purchasedBrands = new Set<string>();

        for (const order of orders) {
            const items = order.items as any[];
            for (const item of items) {
                if (item.categoryId) purchasedCategories.add(item.categoryId);
                if (item.brandId) purchasedBrands.add(item.brandId);
            }
        }

        // If no purchase history, return popular products
        if (purchasedCategories.size === 0 && purchasedBrands.size === 0) {
            return this.getPopularProducts(limit);
        }

        // Get recommendations based on purchase history
        const recommendations = await this.prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { categoryId: { in: Array.from(purchasedCategories) } },
                    { brandId: { in: Array.from(purchasedBrands) } },
                ],
            },
            take: limit,
            orderBy: [
                { rating: 'desc' },
                { sold: 'desc' },
            ],
            include: {
                brand: true,
                category: true,
            },
        });

        return recommendations;
    }

    /**
     * Get popular products
     */
    async getPopularProducts(limit = 12) {
        return this.prisma.product.findMany({
            where: { isActive: true },
            take: limit,
            orderBy: { sold: 'desc' },
            include: {
                brand: true,
                category: true,
            },
        });
    }

    /**
     * Get trending products (most sold in last 7 days)
     */
    async getTrendingProducts(limit = 8) {
        // Get orders from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentOrders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
                paymentStatus: 'paid',
            },
            select: { items: true },
        });

        // Count product occurrences
        const productCounts: Record<string, number> = {};
        for (const order of recentOrders) {
            const items = order.items as any[];
            for (const item of items) {
                if (item.productId) {
                    productCounts[item.productId] = (productCounts[item.productId] || 0) + (item.quantity || 1);
                }
            }
        }

        // Get top product IDs
        const topProductIds = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id]) => id);

        if (topProductIds.length === 0) {
            return this.getPopularProducts(limit);
        }

        // Fetch products
        return this.prisma.product.findMany({
            where: {
                id: { in: topProductIds },
                isActive: true,
            },
            include: {
                brand: true,
                category: true,
            },
        });
    }

    /**
     * Get new arrivals
     */
    async getNewArrivals(limit = 8) {
        return this.prisma.product.findMany({
            where: { isActive: true },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                brand: true,
                category: true,
            },
        });
    }

    /**
     * Get "customers also bought" for a product
     */
    async getFrequentlyBoughtTogether(productId: string, limit = 4) {
        // Find recent orders and filter in memory for those containing productId
        const orders = await this.prisma.order.findMany({
            select: { items: true },
            take: 200,
            orderBy: { createdAt: 'desc' },
        });

        // Filter orders containing this product
        const relevantOrders = orders.filter((order) => {
            const items = order.items as any[];
            return Array.isArray(items) && items.some((item) => item.productId === productId);
        });

        // Count co-purchased products
        const coPurchased: Record<string, number> = {};
        for (const order of relevantOrders) {
            const items = order.items as any[];
            for (const item of items) {
                if (item.productId && item.productId !== productId) {
                    coPurchased[item.productId] = (coPurchased[item.productId] || 0) + 1;
                }
            }
        }

        // Get top co-purchased product IDs
        const topIds = Object.entries(coPurchased)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([id]) => id);

        if (topIds.length === 0) {
            return this.getSimilarProducts(productId, limit);
        }

        return this.prisma.product.findMany({
            where: {
                id: { in: topIds },
                isActive: true,
            },
            include: {
                brand: true,
                category: true,
            },
        });
    }
}
