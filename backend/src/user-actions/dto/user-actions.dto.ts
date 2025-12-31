import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddToCartDto {
    @IsNotEmpty()
    @IsString()
    productId: string;

    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @IsOptional()
    @IsString()
    selectedColor?: string;

    @IsOptional()
    @IsString()
    selectedSize?: string;
}

export class UpdateCartItemDto {
    @IsNotEmpty()
    @IsNumber()
    quantity: number;
}

export class ToggleListDto {
    @IsNotEmpty()
    @IsString()
    productId: string;
}
