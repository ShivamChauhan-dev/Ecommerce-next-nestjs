import { IsString, IsNumber, IsOptional, Min, IsObject } from 'class-validator';

export class CreatePaymentOrderDto {
    @IsNumber()
    @Min(1)
    amount: number;

    @IsString()
    @IsOptional()
    currency?: string = 'INR';

    @IsString()
    orderId: string;

    @IsObject()
    @IsOptional()
    notes?: Record<string, string>;
}

export class VerifyPaymentDto {
    @IsString()
    razorpay_order_id: string;

    @IsString()
    razorpay_payment_id: string;

    @IsString()
    razorpay_signature: string;

    @IsString()
    orderId: string;
}

export class WebhookPayloadDto {
    event: string;
    payload: {
        payment?: {
            entity: {
                id: string;
                order_id: string;
                amount: number;
                currency: string;
                status: string;
                method: string;
                error_code?: string;
                error_description?: string;
            };
        };
        refund?: {
            entity: {
                id: string;
                payment_id: string;
                amount: number;
                status: string;
            };
        };
    };
}
