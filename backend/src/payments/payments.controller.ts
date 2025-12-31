import {
    Controller,
    Post,
    Body,
    Headers,
    Get,
    Param,
    UseGuards,
    Req,
    HttpCode,
    RawBodyRequest,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentOrderDto, VerifyPaymentDto } from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    /**
     * Create a Razorpay order for payment
     */
    @Post('create-order')
    @UseGuards(JwtAuthGuard)
    async createOrder(@Body() dto: CreatePaymentOrderDto) {
        return this.paymentsService.createOrder(dto);
    }

    /**
     * Verify payment signature after successful payment
     */
    @Post('verify')
    @UseGuards(JwtAuthGuard)
    async verifyPayment(@Body() dto: VerifyPaymentDto) {
        return this.paymentsService.verifyPayment(dto);
    }

    /**
     * Razorpay webhook endpoint
     * Must be publicly accessible (no auth guard)
     */
    @Post('webhook')
    @HttpCode(200)
    async handleWebhook(
        @Body() payload: any,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        return this.paymentsService.handleWebhook(payload, signature);
    }

    /**
     * Get payment details by order ID
     */
    @Get('order/:orderId')
    @UseGuards(JwtAuthGuard)
    async getPaymentByOrderId(@Param('orderId') orderId: string) {
        return this.paymentsService.getPaymentByOrderId(orderId);
    }

    /**
     * Initiate refund (Admin only - add AdminGuard later)
     */
    @Post('refund/:paymentId')
    @UseGuards(JwtAuthGuard)
    async initiateRefund(
        @Param('paymentId') paymentId: string,
        @Body('amount') amount?: number,
    ) {
        return this.paymentsService.initiateRefund(paymentId, amount);
    }
}
