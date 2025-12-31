import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('recommendations')
export class RecommendationsController {
    constructor(private readonly recommendationsService: RecommendationsService) { }

    /**
     * Get similar products
     * GET /recommendations/similar/:productId
     */
    @Get('similar/:productId')
    async getSimilarProducts(
        @Param('productId') productId: string,
        @Query('limit') limit?: string,
    ) {
        return this.recommendationsService.getSimilarProducts(
            productId,
            limit ? parseInt(limit, 10) : 8,
        );
    }

    /**
     * Get personalized recommendations (requires auth)
     * GET /recommendations/personalized
     */
    @Get('personalized')
    @UseGuards(JwtAuthGuard)
    async getPersonalizedRecommendations(
        @Request() req,
        @Query('limit') limit?: string,
    ) {
        return this.recommendationsService.getPersonalizedRecommendations(
            req.user.sub,
            limit ? parseInt(limit, 10) : 12,
        );
    }

    /**
     * Get popular products
     * GET /recommendations/popular
     */
    @Get('popular')
    async getPopularProducts(@Query('limit') limit?: string) {
        return this.recommendationsService.getPopularProducts(
            limit ? parseInt(limit, 10) : 12,
        );
    }

    /**
     * Get trending products
     * GET /recommendations/trending
     */
    @Get('trending')
    async getTrendingProducts(@Query('limit') limit?: string) {
        return this.recommendationsService.getTrendingProducts(
            limit ? parseInt(limit, 10) : 8,
        );
    }

    /**
     * Get new arrivals
     * GET /recommendations/new-arrivals
     */
    @Get('new-arrivals')
    async getNewArrivals(@Query('limit') limit?: string) {
        return this.recommendationsService.getNewArrivals(
            limit ? parseInt(limit, 10) : 8,
        );
    }

    /**
     * Get frequently bought together
     * GET /recommendations/bought-together/:productId
     */
    @Get('bought-together/:productId')
    async getFrequentlyBoughtTogether(
        @Param('productId') productId: string,
        @Query('limit') limit?: string,
    ) {
        return this.recommendationsService.getFrequentlyBoughtTogether(
            productId,
            limit ? parseInt(limit, 10) : 4,
        );
    }
}
