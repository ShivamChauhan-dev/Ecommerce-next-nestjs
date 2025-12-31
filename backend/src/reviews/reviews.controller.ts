import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    /**
     * Get reviews for a product
     * GET /reviews/product/:productId
     */
    @Get('product/:productId')
    async getProductReviews(
        @Param('productId') productId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('rating') rating?: string,
        @Query('sortBy') sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful',
    ) {
        const take = limit ? parseInt(limit, 10) : 10;
        const skip = page ? (parseInt(page, 10) - 1) * take : 0;

        return this.reviewsService.getProductReviews(productId, {
            skip,
            take,
            rating: rating ? parseInt(rating, 10) : undefined,
            sortBy,
        });
    }

    /**
     * Create a review
     * POST /reviews/:productId
     */
    @Post(':productId')
    @UseGuards(JwtAuthGuard)
    async createReview(
        @Request() req,
        @Param('productId') productId: string,
        @Body() body: { rating: number; title?: string; comment: string; mediaUrls?: { url: string; type: string }[] },
    ) {
        return this.reviewsService.createReview(req.user.sub, productId, body);
    }

    /**
     * Mark review as helpful
     * POST /reviews/:id/helpful
     */
    @Post(':id/helpful')
    @UseGuards(JwtAuthGuard)
    async markHelpful(@Request() req, @Param('id') id: string) {
        return this.reviewsService.markHelpful(id, req.user.sub);
    }

    /**
     * Delete own review
     * DELETE /reviews/:id
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteReview(@Request() req, @Param('id') id: string) {
        return this.reviewsService.deleteReview(id, req.user.sub, false);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all reviews for moderation
     * GET /reviews/admin/all
     */
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getAllReviews(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('approved') approved?: string,
    ) {
        const take = limit ? parseInt(limit, 10) : 20;
        const skip = page ? (parseInt(page, 10) - 1) * take : 0;

        return this.reviewsService.getAllReviews({
            skip,
            take,
            approved: approved ? approved === 'true' : undefined,
        });
    }

    /**
     * Moderate review
     * POST /reviews/admin/:id/moderate
     */
    @Post('admin/:id/moderate')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async moderateReview(
        @Param('id') id: string,
        @Body('approve') approve: boolean,
    ) {
        return this.reviewsService.moderateReview(id, approve);
    }

    /**
     * Admin delete review
     * DELETE /reviews/admin/:id
     */
    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async adminDeleteReview(@Request() req, @Param('id') id: string) {
        return this.reviewsService.deleteReview(id, req.user.sub, true);
    }
}
