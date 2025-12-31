import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ReviewsService {
    constructor(
        private prisma: PrismaService,
        private uploadsService: UploadsService,
    ) { }

    /**
     * Create a new review
     */
    async createReview(
        userId: string,
        productId: string,
        data: {
            rating: number;
            title?: string;
            comment: string;
            mediaUrls?: { url: string; type: string }[];
        },
    ) {
        // Check if user already reviewed this product
        const existingReview = await this.prisma.review.findFirst({
            where: { userId, productId },
        });

        if (existingReview) {
            throw new BadRequestException('You have already reviewed this product');
        }

        // Check if user purchased this product (verified review)
        const order = await this.prisma.order.findFirst({
            where: {
                userId,
                status: 'delivered',
            },
        });

        const isVerified = !!order;

        // Create review
        const review = await this.prisma.review.create({
            data: {
                rating: data.rating,
                title: data.title,
                comment: data.comment,
                isVerified,
                userId,
                productId,
                media: data.mediaUrls
                    ? {
                        create: data.mediaUrls.map((m) => ({
                            url: m.url,
                            type: m.type,
                        })),
                    }
                    : undefined,
            },
            include: {
                user: {
                    select: { firstName: true, lastName: true, avatar: true },
                },
                media: true,
            },
        });

        // Update product average rating
        await this.updateProductRating(productId);

        return review;
    }

    /**
     * Get reviews for a product
     */
    async getProductReviews(
        productId: string,
        params: {
            skip?: number;
            take?: number;
            rating?: number;
            sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful';
        },
    ) {
        const where: any = {
            productId,
            isApproved: true,
        };

        if (params.rating) {
            where.rating = params.rating;
        }

        let orderBy: any = { createdAt: 'desc' };
        switch (params.sortBy) {
            case 'highest':
                orderBy = { rating: 'desc' };
                break;
            case 'lowest':
                orderBy = { rating: 'asc' };
                break;
            case 'helpful':
                orderBy = { helpfulCount: 'desc' };
                break;
        }

        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip: params.skip || 0,
                take: params.take || 10,
                orderBy,
                include: {
                    user: {
                        select: { firstName: true, lastName: true, avatar: true },
                    },
                    media: true,
                },
            }),
            this.prisma.review.count({ where }),
        ]);

        // Get rating breakdown
        const ratingBreakdown = await this.prisma.review.groupBy({
            by: ['rating'],
            where: { productId, isApproved: true },
            _count: true,
        });

        return {
            reviews,
            total,
            ratingBreakdown: ratingBreakdown.map((r) => ({
                rating: r.rating,
                count: r._count,
            })),
        };
    }

    /**
     * Mark review as helpful
     */
    async markHelpful(reviewId: string, userId: string) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Increment helpful count
        return this.prisma.review.update({
            where: { id: reviewId },
            data: { helpfulCount: { increment: 1 } },
        });
    }

    /**
     * Admin: Moderate review
     */
    async moderateReview(reviewId: string, approve: boolean) {
        return this.prisma.review.update({
            where: { id: reviewId },
            data: { isApproved: approve },
        });
    }

    /**
     * Admin: Get all reviews for moderation
     */
    async getAllReviews(params: { skip?: number; take?: number; approved?: boolean }) {
        const where: any = {};
        if (params.approved !== undefined) {
            where.isApproved = params.approved;
        }

        return this.prisma.review.findMany({
            skip: params.skip || 0,
            take: params.take || 20,
            where,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                product: { select: { name: true, slug: true } },
                media: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Delete review
     */
    async deleteReview(reviewId: string, userId: string, isAdmin = false) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (!isAdmin && review.userId !== userId) {
            throw new ForbiddenException('Not authorized to delete this review');
        }

        // Delete media files if any
        const media = await this.prisma.reviewMedia.findMany({
            where: { reviewId },
        });

        // Delete review (cascades to media)
        await this.prisma.review.delete({
            where: { id: reviewId },
        });

        // Update product rating
        await this.updateProductRating(review.productId);

        return { success: true };
    }

    /**
     * Update product average rating
     */
    private async updateProductRating(productId: string) {
        const avgRating = await this.prisma.review.aggregate({
            where: { productId, isApproved: true },
            _avg: { rating: true },
        });

        await this.prisma.product.update({
            where: { id: productId },
            data: { rating: avgRating._avg.rating || 0 },
        });
    }
}
