import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * Get dashboard summary
     * GET /analytics/dashboard
     */
    @Get('dashboard')
    async getDashboardSummary() {
        return this.analyticsService.getDashboardSummary();
    }

    /**
     * Get sales overview
     * GET /analytics/sales?period=week
     */
    @Get('sales')
    async getSalesOverview(
        @Query('period') period?: 'day' | 'week' | 'month',
    ) {
        return this.analyticsService.getSalesOverview(period || 'week');
    }

    /**
     * Get top selling products
     * GET /analytics/top-products?limit=10
     */
    @Get('top-products')
    async getTopProducts(@Query('limit') limit?: string) {
        return this.analyticsService.getTopProducts(parseInt(limit || '10', 10));
    }

    /**
     * Get orders grouped by status
     * GET /analytics/orders-by-status
     */
    @Get('orders-by-status')
    async getOrdersByStatus() {
        return this.analyticsService.getOrdersByStatus();
    }

    /**
     * Get revenue by category
     * GET /analytics/revenue-by-category
     */
    @Get('revenue-by-category')
    async getRevenueByCategory() {
        return this.analyticsService.getRevenueByCategory();
    }

    /**
     * Get user growth stats
     * GET /analytics/user-growth?period=month
     */
    @Get('user-growth')
    async getUserGrowth(@Query('period') period?: 'week' | 'month') {
        return this.analyticsService.getUserGrowth(period || 'month');
    }
}
