import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
    // We can add shipping info here
    @IsOptional()
    note?: string;

    // Assuming valid address ID needed, or full address object. 
    // For now simple.
    @IsNotEmpty()
    @IsString()
    addressId: string;
}
