import { IsOptional, IsString } from 'class-validator';

export class UpdateStoreSettingsDto {
    @IsOptional()
    @IsString()
    storeName?: string;

    @IsOptional()
    @IsString()
    logo?: string;

    @IsOptional()
    @IsString()
    currencyCode?: string;

    @IsOptional()
    @IsString()
    currencySymbol?: string;

    @IsOptional()
    @IsString()
    currencyName?: string;

    @IsOptional()
    @IsString()
    currencyLocale?: string;

    @IsOptional()
    @IsString()
    timezoneValue?: string;

    @IsOptional()
    @IsString()
    timezoneLabel?: string;

    @IsOptional()
    @IsString()
    timezoneOffset?: string;
}
