import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/orders.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async createOrder(userId: string, dto: CreateOrderDto) {
        // 1. Get Cart Items
        const cart = await this.prisma.cart.findUnique({
            where: { userId },
            include: { items: true }
        });

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // 2. Fetch Product Info to calculate price snapshot
        const productIds = cart.items.map(i => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        let total = 0;
        const orderItems = cart.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

            // Calculate item total
            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            // Snapshot
            return {
                productId: item.productId,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                selectedColor: item.selectedColor,
                selectedSize: item.selectedSize,
                image: product.images[0]
            };
        });

        // 3. Create Order
        // Note: Transaction is safe on MongoDB replica set, fallback logic if standalone?
        // Prisma transactions work on MongoDB replica sets. User has replica set in docker compose.

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Using $transaction to create order and clear cart items
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    userId,
                    items: orderItems, // Stored as JSON
                    subtotal: total,
                    total,
                    status: 'pending',
                    paymentStatus: 'unpaid'
                }
            });

            // Clear cart items
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            return order;
        });
    }

    async getMyOrders(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getOrderById(userId: string, orderId: string) {
        return this.prisma.order.findFirst({
            where: { id: orderId, userId }
        });
    }

    // ==================== ADMIN ORDER MANAGEMENT ====================

    /**
     * Get all orders (admin)
     */
    async getAllOrders(params: {
        page?: number;
        limit?: number;
        status?: string;
        paymentStatus?: string;
    }) {
        const page = params.page || 1;
        const limit = params.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (params.status) where.status = params.status;
        if (params.paymentStatus) where.paymentStatus = params.paymentStatus;

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            orders,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }

    /**
     * Update order status (admin)
     */
    async updateOrderStatus(orderId: string, status: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status },
        });
    }

    /**
     * Cancel order
     */
    async cancelOrder(orderId: string, userId?: string) {
        const where: any = { id: orderId };
        if (userId) where.userId = userId; // Ensure user owns the order

        const order = await this.prisma.order.findFirst({ where });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Only allow cancellation for pending/confirmed orders
        if (!['pending', 'confirmed'].includes(order.status)) {
            throw new BadRequestException('Cannot cancel order in current status');
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'cancelled' },
        });
    }

    /**
     * Get order stats (admin)
     */
    async getOrderStats() {
        const [total, pending, confirmed, shipped, delivered, cancelled] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { status: 'pending' } }),
            this.prisma.order.count({ where: { status: 'confirmed' } }),
            this.prisma.order.count({ where: { status: 'shipped' } }),
            this.prisma.order.count({ where: { status: 'delivered' } }),
            this.prisma.order.count({ where: { status: 'cancelled' } }),
        ]);

        // Revenue
        const revenue = await this.prisma.order.aggregate({
            where: { paymentStatus: 'paid' },
            _sum: { total: true },
        });

        return {
            total,
            pending,
            confirmed,
            shipped,
            delivered,
            cancelled,
            revenue: revenue._sum.total || 0,
        };
    }

    /**
     * Get order by ID (admin - no user filter)
     */
    async getOrderByIdAdmin(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
                payment: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }
}

