import {
    Injectable,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { CreatePaymentOrderDto, VerifyPaymentDto } from './dto/payments.dto';
import * as crypto from 'crypto';

// Razorpay types
interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
    status: string;
}

@Injectable()
export class PaymentsService {
    private razorpay: any = null;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        // Only initialize Razorpay if credentials are provided
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        if (keyId && keySecret) {
            const Razorpay = require('razorpay');
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
        } else {
            console.warn('⚠️ Razorpay credentials not configured. Payment features will be disabled.');
        }
    }

    /**
     * Create a Razorpay order
     */
    async createOrder(dto: CreatePaymentOrderDto): Promise<{
        razorpayOrderId: string;
        amount: number;
        currency: string;
        key: string;
    }> {
        try {
            // Check if Razorpay is configured
            if (!this.razorpay) {
                throw new BadRequestException('Payment gateway not configured. Please contact support.');
            }

            // Verify order exists
            const order = await this.prisma.order.findUnique({
                where: { id: dto.orderId },
            });

            if (!order) {
                throw new BadRequestException('Order not found');
            }

            // Create Razorpay order
            const razorpayOrder: RazorpayOrder = await this.razorpay.orders.create({
                amount: Math.round(dto.amount * 100), // Razorpay expects amount in paise
                currency: dto.currency || 'INR',
                receipt: order.orderNumber,
                notes: dto.notes || {},
            });

            // Create payment record
            await this.prisma.payment.create({
                data: {
                    orderId: dto.orderId,
                    razorpayOrderId: razorpayOrder.id,
                    amount: dto.amount,
                    currency: dto.currency || 'INR',
                    status: 'pending',
                },
            });

            return {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: this.configService.get<string>('RAZORPAY_KEY_ID')!,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Razorpay order creation failed:', error);
            throw new InternalServerErrorException('Failed to create payment order');
        }
    }

    /**
     * Verify payment signature
     */
    async verifyPayment(dto: VerifyPaymentDto): Promise<{ success: boolean; message: string }> {
        try {
            // Generate expected signature
            const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
            const body = dto.razorpay_order_id + '|' + dto.razorpay_payment_id;

            const expectedSignature = crypto
                .createHmac('sha256', secret!)
                .update(body)
                .digest('hex');

            if (expectedSignature !== dto.razorpay_signature) {
                throw new BadRequestException('Invalid payment signature');
            }

            // Update payment record
            await this.prisma.payment.update({
                where: { razorpayOrderId: dto.razorpay_order_id },
                data: {
                    razorpayPaymentId: dto.razorpay_payment_id,
                    razorpaySignature: dto.razorpay_signature,
                    status: 'completed',
                },
            });

            // Update order payment status
            await this.prisma.order.update({
                where: { id: dto.orderId },
                data: {
                    paymentStatus: 'paid',
                    status: 'confirmed',
                },
            });

            return { success: true, message: 'Payment verified successfully' };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Payment verification failed:', error);
            throw new InternalServerErrorException('Payment verification failed');
        }
    }

    /**
     * Handle Razorpay webhooks
     */
    async handleWebhook(
        payload: any,
        signature: string,
    ): Promise<{ received: boolean }> {
        try {
            // Verify webhook signature
            const secret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');

            if (secret) {
                const expectedSignature = crypto
                    .createHmac('sha256', secret)
                    .update(JSON.stringify(payload))
                    .digest('hex');

                if (expectedSignature !== signature) {
                    throw new BadRequestException('Invalid webhook signature');
                }
            }

            const event = payload.event;

            switch (event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(payload.payload.payment.entity);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(payload.payload.payment.entity);
                    break;
                case 'refund.created':
                    await this.handleRefundCreated(payload.payload.refund.entity);
                    break;
                default:
                    console.log(`Unhandled webhook event: ${event}`);
            }

            return { received: true };
        } catch (error) {
            console.error('Webhook processing failed:', error);
            throw error;
        }
    }

    private async handlePaymentCaptured(payment: any) {
        await this.prisma.payment.update({
            where: { razorpayOrderId: payment.order_id },
            data: {
                razorpayPaymentId: payment.id,
                status: 'completed',
                method: payment.method,
            },
        });

        // Also update order
        const paymentRecord = await this.prisma.payment.findUnique({
            where: { razorpayOrderId: payment.order_id },
        });

        if (paymentRecord) {
            await this.prisma.order.update({
                where: { id: paymentRecord.orderId },
                data: { paymentStatus: 'paid', status: 'confirmed' },
            });
        }
    }

    private async handlePaymentFailed(payment: any) {
        await this.prisma.payment.update({
            where: { razorpayOrderId: payment.order_id },
            data: {
                status: 'failed',
                failureReason: payment.error_description || payment.error_code,
            },
        });
    }

    private async handleRefundCreated(refund: any) {
        await this.prisma.payment.update({
            where: { razorpayPaymentId: refund.payment_id },
            data: {
                refundId: refund.id,
                refundAmount: refund.amount / 100, // Convert from paise
                status: 'refunded',
            },
        });
    }

    /**
     * Get payment by order ID
     */
    async getPaymentByOrderId(orderId: string) {
        return this.prisma.payment.findUnique({
            where: { orderId },
        });
    }

    /**
     * Initiate refund
     */
    async initiateRefund(paymentId: string, amount?: number) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment || !payment.razorpayPaymentId) {
            throw new BadRequestException('Payment not found or not completed');
        }

        const refundAmount = amount ? Math.round(amount * 100) : undefined;

        const refund = await this.razorpay.payments.refund(payment.razorpayPaymentId, {
            amount: refundAmount,
        });

        await this.prisma.payment.update({
            where: { id: paymentId },
            data: {
                refundId: refund.id,
                refundAmount: refund.amount / 100,
                status: 'refunded',
            },
        });

        // Update order
        await this.prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: 'refunded' },
        });

        return refund;
    }
}
