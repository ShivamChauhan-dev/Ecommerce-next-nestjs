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
}
