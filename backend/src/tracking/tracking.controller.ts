import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('tracking')
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) { }

    /**
     * Get order tracking (public with order ID)
     * GET /tracking/:orderId
     */
    @Get(':orderId')
    async getOrderTracking(@Param('orderId') orderId: string) {
        return this.trackingService.getOrderTracking(orderId);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Add tracking event
     * POST /tracking/:orderId/event
     */
    @Post(':orderId/event')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async addTrackingEvent(
        @Param('orderId') orderId: string,
        @Body() body: { status: string; note?: string; location?: string },
    ) {
        return this.trackingService.addTrackingEvent(orderId, body);
    }

    /**
     * Update tracking number
     * PUT /tracking/:orderId/tracking-number
     */
    @Put(':orderId/tracking-number')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async updateTrackingNumber(
        @Param('orderId') orderId: string,
        @Body('trackingNumber') trackingNumber: string,
    ) {
        return this.trackingService.updateTrackingNumber(orderId, trackingNumber);
    }

    /**
     * Get order status summary
     * GET /tracking/admin/summary
     */
    @Get('admin/summary')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getOrdersSummary() {
        return this.trackingService.getOrdersByStatus();
    }
}
