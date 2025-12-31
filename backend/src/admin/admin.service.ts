import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';
import {
    CreateProductDto,
    UpdateProductDto,
    CreateCategoryDto,
    UpdateCategoryDto,
    CreateBrandDto,
    UpdateBrandDto,
    UpdateOrderStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    // ==================== PRODUCTS ====================

    async createProduct(dto: CreateProductDto) {
        // Check slug uniqueness
        const existing = await this.prisma.product.findUnique({
            where: { slug: dto.slug },
        });

        if (existing) {
            throw new BadRequestException('Product slug already exists');
        }

        // Check SKU uniqueness if provided
        if (dto.sku) {
            const existingSku = await this.prisma.product.findFirst({
                where: { sku: dto.sku },
            });
            if (existingSku) {
                throw new BadRequestException('Product SKU already exists');
            }
        }

        const { variations, ...productData } = dto;

        const product = await this.prisma.product.create({
            data: {
                ...productData,
                quantity: dto.stock || 0, // Sync quantity with stock
                variations: variations
                    ? {
                        create: variations,
                    }
                    : undefined,
            },
            include: {
                variations: true,
                brand: true,
                category: true,
            },
        });

        return product;
    }

    async updateProduct(id: string, dto: UpdateProductDto) {
        const existing = await this.prisma.product.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Product not found');
        }

        // Check slug uniqueness if being updated
        if (dto.slug && dto.slug !== existing.slug) {
            const slugExists = await this.prisma.product.findUnique({
                where: { slug: dto.slug },
            });
            if (slugExists) {
                throw new BadRequestException('Product slug already exists');
            }
        }

        // Check SKU uniqueness if being updated
        if (dto.sku && dto.sku !== existing.sku) {
            const skuExists = await this.prisma.product.findFirst({
                where: { sku: dto.sku },
            });
            if (skuExists) {
                throw new BadRequestException('Product SKU already exists');
            }
        }

        return this.prisma.product.update({
            where: { id },
            data: {
                ...dto,
                quantity: dto.stock !== undefined ? dto.stock : undefined,
            },
            include: {
                variations: true,
                brand: true,
                category: true,
            },
        });
    }

    async deleteProduct(id: string) {
        const existing = await this.prisma.product.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Product not found');
        }

        // Delete variations first
        await this.prisma.productVariation.deleteMany({
            where: { productId: id },
        });

        // Delete reviews
        await this.prisma.review.deleteMany({
            where: { productId: id },
        });

        return this.prisma.product.delete({
            where: { id },
        });
    }

    async getAllProducts(params: {
        skip?: number;
        take?: number;
        includeInactive?: boolean;
        search?: string;
        categoryId?: string;
        brandId?: string;
    }) {
        const where: any = {};

        if (!params.includeInactive) {
            where.isActive = true;
        }

        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { sku: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        if (params.categoryId) {
            where.categoryId = params.categoryId;
        }

        if (params.brandId) {
            where.brandId = params.brandId;
        }

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                skip: params.skip || 0,
                take: params.take || 20,
                where,
                include: {
                    variations: true,
                    brand: true,
                    category: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);

        return { products, total };
    }

    async getLowStockProducts() {
        return this.prisma.product.findMany({
            where: {
                trackInventory: true,
                stock: {
                    lte: this.prisma.product.fields.lowStockAlert,
                },
            },
            include: {
                category: true,
                brand: true,
            },
            orderBy: { stock: 'asc' },
        });
    }

    async updateStock(id: string, quantity: number) {
        const product = await this.prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return this.prisma.product.update({
            where: { id },
            data: {
                stock: quantity,
                quantity: quantity,
            },
        });
    }

    // ==================== CATEGORIES ====================

    async createCategory(dto: CreateCategoryDto) {
        const existing = await this.prisma.category.findUnique({
            where: { slug: dto.slug },
        });

        if (existing) {
            throw new BadRequestException('Category slug already exists');
        }

        return this.prisma.category.create({
            data: dto,
        });
    }

    async updateCategory(id: string, dto: UpdateCategoryDto) {
        const existing = await this.prisma.category.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Category not found');
        }

        if (dto.slug && dto.slug !== existing.slug) {
            const slugExists = await this.prisma.category.findUnique({
                where: { slug: dto.slug },
            });
            if (slugExists) {
                throw new BadRequestException('Category slug already exists');
            }
        }

        return this.prisma.category.update({
            where: { id },
            data: dto,
        });
    }

    async deleteCategory(id: string) {
        const existing = await this.prisma.category.findUnique({
            where: { id },
            include: { products: { take: 1 } },
        });

        if (!existing) {
            throw new NotFoundException('Category not found');
        }

        if (existing.products.length > 0) {
            throw new BadRequestException('Cannot delete category with products');
        }

        return this.prisma.category.delete({
            where: { id },
        });
    }

    async getAllCategories() {
        return this.prisma.category.findMany({
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    // ==================== BRANDS ====================

    async createBrand(dto: CreateBrandDto) {
        const existing = await this.prisma.brand.findUnique({
            where: { slug: dto.slug },
        });

        if (existing) {
            throw new BadRequestException('Brand slug already exists');
        }

        return this.prisma.brand.create({
            data: dto,
        });
    }

    async updateBrand(id: string, dto: UpdateBrandDto) {
        const existing = await this.prisma.brand.findUnique({
            where: { id },
        });

        if (!existing) {
            throw new NotFoundException('Brand not found');
        }

        if (dto.slug && dto.slug !== existing.slug) {
            const slugExists = await this.prisma.brand.findUnique({
                where: { slug: dto.slug },
            });
            if (slugExists) {
                throw new BadRequestException('Brand slug already exists');
            }
        }

        return this.prisma.brand.update({
            where: { id },
            data: dto,
        });
    }

    async deleteBrand(id: string) {
        const existing = await this.prisma.brand.findUnique({
            where: { id },
            include: { products: { take: 1 } },
        });

        if (!existing) {
            throw new NotFoundException('Brand not found');
        }

        if (existing.products.length > 0) {
            throw new BadRequestException('Cannot delete brand with products');
        }

        return this.prisma.brand.delete({
            where: { id },
        });
    }

    async getAllBrands() {
        return this.prisma.brand.findMany({
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });
    }

    // ==================== ORDERS ====================

    async getAllOrders(params: {
        skip?: number;
        take?: number;
        status?: string;
        paymentStatus?: string;
    }) {
        const where: any = {};

        if (params.status) {
            where.status = params.status;
        }

        if (params.paymentStatus) {
            where.paymentStatus = params.paymentStatus;
        }

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                skip: params.skip || 0,
                take: params.take || 20,
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    payment: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);

        return { orders, total };
    }

    async getOrderDetails(id: string) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                user: true,
                payment: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { user: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                status: dto.status,
                trackingNumber: dto.trackingNumber,
                notes: dto.notes,
            },
        });

        // Send status update email if user exists
        if (order.user?.email) {
            await this.emailService.sendOrderStatusUpdate(
                order.user.email,
                order.orderNumber,
                dto.status,
                dto.trackingNumber,
            );
        }

        return updatedOrder;
    }

    // ==================== DASHBOARD STATS ====================

    async getDashboardStats() {
        const [
            totalProducts,
            totalOrders,
            totalUsers,
            pendingOrders,
            todayOrders,
            revenue,
        ] = await Promise.all([
            this.prisma.product.count(),
            this.prisma.order.count(),
            this.prisma.user.count(),
            this.prisma.order.count({ where: { status: 'pending' } }),
            this.prisma.order.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            this.prisma.order.aggregate({
                _sum: { total: true },
                where: { paymentStatus: 'paid' },
            }),
        ]);

        return {
            totalProducts,
            totalOrders,
            totalUsers,
            pendingOrders,
            todayOrders,
            totalRevenue: revenue._sum.total || 0,
        };
    }
}
