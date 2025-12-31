import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
    CreateCouponDto,
    UpdateCouponDto,
    ValidateCouponDto,
    ApplyCouponDto,
    DiscountType,
} from './dto/coupons.dto';

@Injectable()
export class CouponsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a new coupon (Admin)
     */
    async create(dto: CreateCouponDto) {
        // Check if code already exists
        const existing = await this.prisma.coupon.findUnique({
            where: { code: dto.code.toUpperCase() },
        });

        if (existing) {
            throw new BadRequestException('Coupon code already exists');
        }

        return this.prisma.coupon.create({
            data: {
                code: dto.code.toUpperCase(),
                description: dto.description,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                minOrderValue: dto.minOrderValue || 0,
                maxDiscount: dto.maxDiscount,
                maxUses: dto.maxUses,
                perUserLimit: dto.perUserLimit || 1,
                validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
                validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
                isActive: dto.isActive ?? true,
            },
        });
    }

    /**
     * Get all coupons (Admin)
     */
    async findAll(includeInactive = false) {
        return this.prisma.coupon.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get coupon by ID
     */
    async findOne(id: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id },
            include: {
                usages: true,
            },
        });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        return coupon;
    }

    /**
     * Update coupon (Admin)
     */
    async update(id: string, dto: UpdateCouponDto) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id },
        });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        // If updating code, check for duplicates
        if (dto.code && dto.code.toUpperCase() !== coupon.code) {
            const existing = await this.prisma.coupon.findUnique({
                where: { code: dto.code.toUpperCase() },
            });

            if (existing) {
                throw new BadRequestException('Coupon code already exists');
            }
        }

        return this.prisma.coupon.update({
            where: { id },
            data: {
                ...dto,
                code: dto.code?.toUpperCase(),
                validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
                validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
            },
        });
    }

    /**
     * Delete coupon (Admin)
     */
    async delete(id: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id },
        });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        // Delete usage records first, then the coupon
        await this.prisma.couponUsage.deleteMany({
            where: { couponId: id },
        });

        return this.prisma.coupon.delete({
            where: { id },
        });
    }

    /**
     * Validate coupon code (public)
     */
    async validate(dto: ValidateCouponDto): Promise<{
        valid: boolean;
        discount: number;
        message: string;
        coupon?: any;
    }> {
        const coupon = await this.prisma.coupon.findUnique({
            where: { code: dto.code.toUpperCase() },
        });

        if (!coupon) {
            return { valid: false, discount: 0, message: 'Coupon not found' };
        }

        // Check if active
        if (!coupon.isActive) {
            return { valid: false, discount: 0, message: 'Coupon is inactive' };
        }

        // Check validity period
        const now = new Date();
        if (coupon.validFrom && now < coupon.validFrom) {
            return { valid: false, discount: 0, message: 'Coupon is not yet valid' };
        }

        if (coupon.validUntil && now > coupon.validUntil) {
            return { valid: false, discount: 0, message: 'Coupon has expired' };
        }

        // Check usage limit
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return { valid: false, discount: 0, message: 'Coupon usage limit reached' };
        }

        // Check minimum order value
        if (dto.orderTotal < coupon.minOrderValue) {
            return {
                valid: false,
                discount: 0,
                message: `Minimum order value is ₹${coupon.minOrderValue}`,
            };
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === DiscountType.PERCENTAGE) {
            discount = (dto.orderTotal * coupon.discountValue) / 100;
            // Apply max discount cap if set
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.discountValue;
        }

        // Ensure discount doesn't exceed order total
        if (discount > dto.orderTotal) {
            discount = dto.orderTotal;
        }

        return {
            valid: true,
            discount: Math.round(discount * 100) / 100, // Round to 2 decimals
            message: 'Coupon applied successfully',
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
            },
        };
    }

    /**
     * Apply coupon to order (with user limit check)
     */
    async apply(dto: ApplyCouponDto): Promise<{
        valid: boolean;
        discount: number;
        message: string;
        couponId?: string;
    }> {
        const validation = await this.validate({
            code: dto.code,
            orderTotal: dto.orderTotal,
        });

        if (!validation.valid) {
            return { valid: false, discount: 0, message: validation.message };
        }

        const coupon = await this.prisma.coupon.findUnique({
            where: { code: dto.code.toUpperCase() },
        });

        if (!coupon) {
            return { valid: false, discount: 0, message: 'Coupon not found' };
        }

        // Check per-user usage limit
        const userUsageCount = await this.prisma.couponUsage.count({
            where: {
                couponId: coupon.id,
                userId: dto.userId,
            },
        });

        if (userUsageCount >= coupon.perUserLimit) {
            return {
                valid: false,
                discount: 0,
                message: 'You have already used this coupon maximum times',
            };
        }

        return {
            valid: true,
            discount: validation.discount,
            message: validation.message,
            couponId: coupon.id,
        };
    }

    /**
     * Record coupon usage after order is placed
     */
    async recordUsage(couponId: string, userId: string, orderId: string, discount: number) {
        // Create usage record
        await this.prisma.couponUsage.create({
            data: {
                couponId,
                userId,
                orderId,
                discount,
            },
        });

        // Increment used count
        await this.prisma.coupon.update({
            where: { id: couponId },
            data: {
                usedCount: { increment: 1 },
            },
        });
    }
}
