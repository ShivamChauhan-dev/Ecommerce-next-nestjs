import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsDateString,
    Min,
    Max,
    IsEnum,
} from 'class-validator';

export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed',
}

export class CreateCouponDto {
    @IsString()
    code: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(DiscountType)
    discountType: DiscountType;

    @IsNumber()
    @Min(0)
    discountValue: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    minOrderValue?: number = 0;

    @IsNumber()
    @Min(0)
    @IsOptional()
    maxDiscount?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    maxUses?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    perUserLimit?: number = 1;

    @IsDateString()
    @IsOptional()
    validFrom?: string;

    @IsDateString()
    @IsOptional()
    validUntil?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;
}

export class UpdateCouponDto {
    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(DiscountType)
    @IsOptional()
    discountType?: DiscountType;

    @IsNumber()
    @Min(0)
    @IsOptional()
    discountValue?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    minOrderValue?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    maxDiscount?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    maxUses?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    perUserLimit?: number;

    @IsDateString()
    @IsOptional()
    validFrom?: string;

    @IsDateString()
    @IsOptional()
    validUntil?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class ValidateCouponDto {
    @IsString()
    code: string;

    @IsNumber()
    @Min(0)
    orderTotal: number;
}

export class ApplyCouponDto {
    @IsString()
    code: string;

    @IsNumber()
    @Min(0)
    orderTotal: number;

    @IsString()
    userId: string;
}
