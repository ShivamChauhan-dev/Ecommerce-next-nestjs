import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { RecentlyViewedService } from './recently-viewed.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('recently-viewed')
@UseGuards(JwtAuthGuard)
export class RecentlyViewedController {
    constructor(private readonly recentlyViewedService: RecentlyViewedService) { }

    /**
     * Track product view
     * POST /recently-viewed/:productId
     */
    @Post(':productId')
    async trackView(@Request() req, @Param('productId') productId: string) {
        const userId = req.user.sub || req.user.id;
        return this.recentlyViewedService.trackView(userId, productId);
    }

    /**
     * Get recently viewed products
     * GET /recently-viewed
     */
    @Get()
    async getRecentlyViewed(@Request() req, @Query('limit') limit?: string) {
        const userId = req.user.sub || req.user.id;
        return this.recentlyViewedService.getRecentlyViewed(
            userId,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    /**
     * Clear recently viewed
     * DELETE /recently-viewed
     */
    @Delete()
    async clearRecentlyViewed(@Request() req) {
        const userId = req.user.sub || req.user.id;
        return this.recentlyViewedService.clearRecentlyViewed(userId);
    }
}
