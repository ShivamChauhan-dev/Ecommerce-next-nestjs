import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsArray,
    Min,
} from 'class-validator';

export class CreateShippingZoneDto {
    @IsString()
    name: string;

    @IsArray()
    @IsString({ each: true })
    pincodes: string[];

    @IsNumber()
    @Min(0)
    baseCost: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    perKgCost?: number = 0;

    @IsNumber()
    @Min(1)
    @IsOptional()
    minDays?: number = 3;

    @IsNumber()
    @Min(1)
    @IsOptional()
    maxDays?: number = 7;

    @IsNumber()
    @Min(0)
    @IsOptional()
    freeAbove?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean = true;
}

export class UpdateShippingZoneDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    pincodes?: string[];

    @IsNumber()
    @Min(0)
    @IsOptional()
    baseCost?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    perKgCost?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    minDays?: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    maxDays?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    freeAbove?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class CalculateShippingDto {
    @IsString()
    pincode: string;

    @IsNumber()
    @Min(0)
    orderTotal: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    weight?: number = 0; // Weight in kg
}
