import {
    IsString,
    IsNumber,
    IsOptional,
    IsBoolean,
    IsArray,
    Min,
} from 'class-validator';

// ========== PRODUCT DTOs ==========

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    originPrice?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    stock?: number = 0;

    @IsNumber()
    @Min(0)
    @IsOptional()
    lowStockAlert?: number = 5;

    @IsBoolean()
    @IsOptional()
    trackInventory?: boolean = true;

    @IsString()
    description: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsBoolean()
    @IsOptional()
    isNew?: boolean = false;

    @IsBoolean()
    @IsOptional()
    isSale?: boolean = false;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[] = [];



    @IsString()
    @IsOptional()
    brandId?: string;

    @IsString()
    @IsOptional()
    categoryId?: string;

    @IsArray()
    @IsOptional()
    variations?: CreateProductVariationDto[];
}

export class CreateProductVariationDto {
    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    value?: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsNumber()
    @IsOptional()
    priceAdjustment?: number;

    @IsNumber()
    @IsOptional()
    stockQuantity?: number;
}

export class UpdateProductDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    originPrice?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    stock?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    lowStockAlert?: number;

    @IsBoolean()
    @IsOptional()
    trackInventory?: boolean;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    gender?: string;

    @IsBoolean()
    @IsOptional()
    isNew?: boolean;

    @IsBoolean()
    @IsOptional()
    isSale?: boolean;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];



    @IsString()
    @IsOptional()
    brandId?: string;

    @IsString()
    @IsOptional()
    categoryId?: string;
}

// ========== CATEGORY DTOs ==========

export class CreateCategoryDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsString()
    @IsOptional()
    image?: string;
}

export class UpdateCategoryDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    image?: string;
}

// ========== BRAND DTOs ==========

export class CreateBrandDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsString()
    @IsOptional()
    image?: string;
}

export class UpdateBrandDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    image?: string;
}

// ========== ORDER DTOs ==========

export class UpdateOrderStatusDto {
    @IsString()
    status: string; // pending, confirmed, processing, shipped, delivered, cancelled

    @IsString()
    @IsOptional()
    trackingNumber?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
