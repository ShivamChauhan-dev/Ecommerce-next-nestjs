import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TrackingService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get order tracking timeline
     */
    async getOrderTracking(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Get events separately (works after prisma regenerate)
        let events: any[] = [];
        try {
            events = await (this.prisma as any).orderEvent.findMany({
                where: { orderId },
                orderBy: { createdAt: 'desc' },
            });
        } catch (e) {
            // OrderEvent model not yet available
        }

        return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            currentStatus: order.status,
            trackingNumber: order.trackingNumber,
            events,
            estimatedDelivery: this.calculateEstimatedDelivery(order, events),
        };
    }

    /**
     * Add tracking event (admin)
     */
    async addTrackingEvent(
        orderId: string,
        data: {
            status: string;
            note?: string;
            location?: string;
        },
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Create event using dynamic access
        const event = await (this.prisma as any).orderEvent.create({
            data: {
                orderId,
                status: data.status,
                note: data.note,
                location: data.location,
            },
        });

        // Update order status
        await this.prisma.order.update({
            where: { id: orderId },
            data: { status: data.status },
        });

        return event;
    }

    /**
     * Update tracking number
     */
    async updateTrackingNumber(orderId: string, trackingNumber: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: { trackingNumber },
        });
    }

    /**
     * Get orders by status for tracking dashboard
     */
    async getOrdersByStatus() {
        const statusCounts = await this.prisma.order.groupBy({
            by: ['status'],
            _count: true,
        });

        return statusCounts.map((s) => ({
            status: s.status,
            count: s._count,
        }));
    }

    /**
     * Calculate estimated delivery
     */
    private calculateEstimatedDelivery(order: any, events: any[]): string | null {
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return null;
        }

        // Default: 5-7 days from order date
        const deliveryDate = new Date(order.createdAt);
        deliveryDate.setDate(deliveryDate.getDate() + 7);

        if (order.status === 'shipped') {
            // If shipped, estimate 2-3 days
            const shippedEvent = events?.find((e: any) => e.status === 'shipped');
            if (shippedEvent) {
                const shipDate = new Date(shippedEvent.createdAt);
                shipDate.setDate(shipDate.getDate() + 3);
                return shipDate.toISOString().split('T')[0];
            }
        }

        return deliveryDate.toISOString().split('T')[0];
    }
}

