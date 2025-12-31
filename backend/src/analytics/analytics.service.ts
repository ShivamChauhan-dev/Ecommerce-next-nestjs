import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get sales overview for a given period
     */
    async getSalesOverview(period: 'day' | 'week' | 'month' = 'week') {
        const now = new Date();
        let startDate: Date;
        let groupByFormat: string;

        switch (period) {
            case 'day':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                groupByFormat = 'hour';
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                groupByFormat = 'day';
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                groupByFormat = 'day';
                break;
        }

        // Get orders for the period
        const orders = await this.prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
            },
            select: {
                total: true,
                status: true,
                paymentStatus: true,
                createdAt: true,
            },
        });

        // Calculate totals
        const totalOrders = orders.length;
        const totalRevenue = orders
            .filter((o) => o.paymentStatus === 'paid')
            .reduce((sum, o) => sum + o.total, 0);
        const completedOrders = orders.filter(
            (o) => o.status === 'delivered',
        ).length;
        const pendingOrders = orders.filter((o) => o.status === 'pending').length;

        // Group by date for chart
        const salesByDate = this.groupOrdersByDate(orders, groupByFormat);

        return {
            period,
            totalOrders,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            completedOrders,
            pendingOrders,
            averageOrderValue:
                totalOrders > 0
                    ? Math.round((totalRevenue / totalOrders) * 100) / 100
                    : 0,
            salesByDate,
        };
    }

    /**
     * Get top selling products
     */
    async getTopProducts(limit = 10) {
        const products = await this.prisma.product.findMany({
            take: limit,
            orderBy: { sold: 'desc' },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                sold: true,
                images: true,
                category: {
                    select: { name: true },
                },
            },
        });

        return products.map((p) => ({
            ...p,
            revenue: p.sold * p.price,
            image: p.images[0] || null,
        }));
    }

    /**
     * Get orders grouped by status
     */
    async getOrdersByStatus() {
        const orders = await this.prisma.order.groupBy({
            by: ['status'],
            _count: true,
        });

        const statusLabels: Record<string, string> = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
        };

        return orders.map((o) => ({
            status: o.status,
            label: statusLabels[o.status] || o.status,
            count: o._count,
        }));
    }

    /**
     * Get revenue by category
     */
    async getRevenueByCategory() {
        // Get all orders with items
        const orders = await this.prisma.order.findMany({
            where: { paymentStatus: 'paid' },
            select: { items: true },
        });

        // Extract product data from order items
        const categoryRevenue: Record<string, number> = {};

        for (const order of orders) {
            const items = order.items as any[];
            if (Array.isArray(items)) {
                for (const item of items) {
                    const categoryName = item.category?.name || 'Uncategorized';
                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                    categoryRevenue[categoryName] =
                        (categoryRevenue[categoryName] || 0) + itemTotal;
                }
            }
        }

        return Object.entries(categoryRevenue)
            .map(([category, revenue]) => ({
                category,
                revenue: Math.round(revenue * 100) / 100,
            }))
            .sort((a, b) => b.revenue - a.revenue);
    }

    /**
     * Get user growth stats
     */
    async getUserGrowth(period: 'week' | 'month' = 'month') {
        const now = new Date();
        const startDate =
            period === 'week'
                ? new Date(now.setDate(now.getDate() - 7))
                : new Date(now.setMonth(now.getMonth() - 1));

        const users = await this.prisma.user.findMany({
            where: {
                createdAt: { gte: startDate },
            },
            select: {
                createdAt: true,
            },
        });

        const totalUsers = await this.prisma.user.count();
        const newUsers = users.length;

        // Group by date
        const usersByDate = this.groupByDate(users, 'createdAt');

        return {
            period,
            totalUsers,
            newUsers,
            usersByDate,
        };
    }

    /**
     * Get dashboard summary
     */
    async getDashboardSummary() {
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            totalProducts,
            activeProducts,
            totalOrders,
            todayOrders,
            monthlyRevenue,
            totalUsers,
            lowStockCount,
            pendingOrders,
        ] = await Promise.all([
            this.prisma.product.count(),
            this.prisma.product.count({ where: { isActive: true } }),
            this.prisma.order.count(),
            this.prisma.order.count({
                where: { createdAt: { gte: startOfToday } },
            }),
            this.prisma.order.aggregate({
                _sum: { total: true },
                where: {
                    createdAt: { gte: startOfMonth },
                    paymentStatus: 'paid',
                },
            }),
            this.prisma.user.count(),
            this.prisma.product.count({
                where: {
                    trackInventory: true,
                    stock: { lte: 5 },
                },
            }),
            this.prisma.order.count({ where: { status: 'pending' } }),
        ]);

        return {
            products: {
                total: totalProducts,
                active: activeProducts,
                lowStock: lowStockCount,
            },
            orders: {
                total: totalOrders,
                today: todayOrders,
                pending: pendingOrders,
            },
            revenue: {
                monthly: monthlyRevenue._sum.total || 0,
            },
            users: {
                total: totalUsers,
            },
        };
    }

    // ==================== HELPER METHODS ====================

    private groupOrdersByDate(
        orders: { total: number; createdAt: Date }[],
        format: string,
    ) {
        const grouped: Record<string, { orders: number; revenue: number }> = {};

        for (const order of orders) {
            const key = this.formatDate(order.createdAt, format);
            if (!grouped[key]) {
                grouped[key] = { orders: 0, revenue: 0 };
            }
            grouped[key].orders++;
            grouped[key].revenue += order.total;
        }

        return Object.entries(grouped).map(([date, data]) => ({
            date,
            orders: data.orders,
            revenue: Math.round(data.revenue * 100) / 100,
        }));
    }

    private groupByDate(items: { createdAt: Date }[], field: string) {
        const grouped: Record<string, number> = {};

        for (const item of items) {
            const key = this.formatDate(item.createdAt, 'day');
            grouped[key] = (grouped[key] || 0) + 1;
        }

        return Object.entries(grouped).map(([date, count]) => ({
            date,
            count,
        }));
    }

    private formatDate(date: Date, format: string): string {
        const d = new Date(date);
        if (format === 'hour') {
            return `${d.getHours()}:00`;
        }
        return d.toISOString().split('T')[0];
    }
}
