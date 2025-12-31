import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async findAll(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.ProductWhereUniqueInput;
        where?: Prisma.ProductWhereInput;
        orderBy?: Prisma.ProductOrderByWithRelationInput;
    }) {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.product.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
            include: {
                variations: true,
                brand: true,
                category: true,
            },
        });
    }

    async findOne(slug: string) {
        return this.prisma.product.findUnique({
            where: { slug },
            include: {
                variations: true,
                brand: true,
                category: true,
                reviews: true,
            },
        });
    }

    /**
     * Search products by keyword
     * Searches in name and description
     */
    async searchProducts(params: {
        query: string;
        skip?: number;
        take?: number;
        categoryId?: string;
        brandId?: string;
        minPrice?: number;
        maxPrice?: number;
        sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'popular';
    }) {
        const { query, skip = 0, take = 20, categoryId, brandId, minPrice, maxPrice, sortBy = 'relevance' } = params;

        // Build where clause
        const where: Prisma.ProductWhereInput = {
            isActive: true,
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ],
        };

        // Apply filters
        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (brandId) {
            where.brandId = brandId;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) {
                where.price.gte = minPrice;
            }
            if (maxPrice !== undefined) {
                where.price.lte = maxPrice;
            }
        }

        // Build orderBy
        let orderBy: Prisma.ProductOrderByWithRelationInput = {};
        switch (sortBy) {
            case 'price-asc':
                orderBy = { price: 'asc' };
                break;
            case 'price-desc':
                orderBy = { price: 'desc' };
                break;
            case 'newest':
                orderBy = { createdAt: 'desc' };
                break;
            case 'popular':
                orderBy = { sold: 'desc' };
                break;
            default:
                // Relevance - sort by rating as proxy
                orderBy = { rating: 'desc' };
        }

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                skip,
                take,
                where,
                orderBy,
                include: {
                    brand: true,
                    category: true,
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            products,
            total,
            skip,
            take,
            hasMore: skip + products.length < total,
        };
    }
}

