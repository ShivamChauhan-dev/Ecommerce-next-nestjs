import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    async findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('category') category?: string,
        @Query('type') type?: string,
        @Query('gender') gender?: string,
        @Query('sort') sort?: string,
    ) {
        const take = limit ? Number(limit) : 10;
        const skip = page ? (Number(page) - 1) * take : 0;

        const where: any = {};
        if (category) where.category = { slug: category }; // Assumes relationship filtering
        if (type) where.type = type;
        if (gender) where.gender = gender;

        let orderBy: any = {};
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        else if (sort === 'price_desc') orderBy = { price: 'desc' };
        else if (sort === 'newest') orderBy = { id: 'desc' }; // or createdAt if added

        return this.productsService.findAll({
            skip,
            take,
            where,
            orderBy,
        });
    }

    /**
     * Search products
     * GET /products/search?q=keyword
     */
    @Get('search')
    async search(
        @Query('q') query: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('categoryId') categoryId?: string,
        @Query('brandId') brandId?: string,
        @Query('minPrice') minPrice?: string,
        @Query('maxPrice') maxPrice?: string,
        @Query('sort') sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'popular',
    ) {
        const take = limit ? Number(limit) : 20;
        const skip = page ? (Number(page) - 1) * take : 0;

        return this.productsService.searchProducts({
            query: query || '',
            skip,
            take,
            categoryId,
            brandId,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sortBy: sortBy || 'relevance',
        });
    }

    @Get(':slug')
    async findOne(@Param('slug') slug: string) {
        return this.productsService.findOne(slug);
    }
}

