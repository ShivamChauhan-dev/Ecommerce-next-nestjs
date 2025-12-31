import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import {
    CreateProductDto,
    UpdateProductDto,
    CreateCategoryDto,
    UpdateCategoryDto,
    CreateBrandDto,
    UpdateBrandDto,
    UpdateOrderStatusDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ==================== DASHBOARD ====================

    @Get('dashboard')
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    // ==================== PRODUCTS ====================

    @Get('products')
    async getAllProducts(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('includeInactive') includeInactive?: string,
        @Query('search') search?: string,
        @Query('categoryId') categoryId?: string,
        @Query('brandId') brandId?: string,
    ) {
        return this.adminService.getAllProducts({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            includeInactive: includeInactive === 'true',
            search,
            categoryId,
            brandId,
        });
    }

    @Get('products/low-stock')
    async getLowStockProducts() {
        return this.adminService.getLowStockProducts();
    }

    @Post('products')
    async createProduct(@Body() dto: CreateProductDto) {
        return this.adminService.createProduct(dto);
    }

    @Put('products/:id')
    async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.adminService.updateProduct(id, dto);
    }

    @Put('products/:id/stock')
    async updateStock(
        @Param('id') id: string,
        @Body('quantity') quantity: number,
    ) {
        return this.adminService.updateStock(id, quantity);
    }

    @Delete('products/:id')
    async deleteProduct(@Param('id') id: string) {
        return this.adminService.deleteProduct(id);
    }

    // ==================== CATEGORIES ====================

    @Get('categories')
    async getAllCategories() {
        return this.adminService.getAllCategories();
    }

    @Post('categories')
    async createCategory(@Body() dto: CreateCategoryDto) {
        return this.adminService.createCategory(dto);
    }

    @Put('categories/:id')
    async updateCategory(
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
    ) {
        return this.adminService.updateCategory(id, dto);
    }

    @Delete('categories/:id')
    async deleteCategory(@Param('id') id: string) {
        return this.adminService.deleteCategory(id);
    }

    // ==================== BRANDS ====================

    @Get('brands')
    async getAllBrands() {
        return this.adminService.getAllBrands();
    }

    @Post('brands')
    async createBrand(@Body() dto: CreateBrandDto) {
        return this.adminService.createBrand(dto);
    }

    @Put('brands/:id')
    async updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
        return this.adminService.updateBrand(id, dto);
    }

    @Delete('brands/:id')
    async deleteBrand(@Param('id') id: string) {
        return this.adminService.deleteBrand(id);
    }

    // ==================== ORDERS ====================

    @Get('orders')
    async getAllOrders(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('status') status?: string,
        @Query('paymentStatus') paymentStatus?: string,
    ) {
        return this.adminService.getAllOrders({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            status,
            paymentStatus,
        });
    }

    @Get('orders/:id')
    async getOrderDetails(@Param('id') id: string) {
        return this.adminService.getOrderDetails(id);
    }

    @Put('orders/:id/status')
    async updateOrderStatus(
        @Param('id') id: string,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        return this.adminService.updateOrderStatus(id, dto);
    }
}
