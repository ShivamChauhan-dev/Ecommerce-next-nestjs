import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateStoreSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get store settings (creates default if not exists)
     */
    async getSettings() {
        let settings = await this.prisma.storeSettings.findFirst();

        if (!settings) {
            // Create default settings
            settings = await this.prisma.storeSettings.create({
                data: {
                    storeName: 'Anvogue',
                    currencyCode: 'USD',
                    currencySymbol: '$',
                    currencyName: 'US Dollar',
                    currencyLocale: 'en-US',
                    timezoneValue: 'Asia/Kolkata',
                    timezoneLabel: 'India Standard Time',
                    timezoneOffset: 'UTC+5:30',
                },
            });
        }

        return settings;
    }

    /**
     * Update store settings
     */
    async updateSettings(dto: UpdateStoreSettingsDto) {
        let settings = await this.prisma.storeSettings.findFirst();

        if (!settings) {
            // Create new settings
            settings = await this.prisma.storeSettings.create({
                data: {
                    storeName: dto.storeName || 'Anvogue',
                    logo: dto.logo,
                    currencyCode: dto.currencyCode || 'USD',
                    currencySymbol: dto.currencySymbol || '$',
                    currencyName: dto.currencyName || 'US Dollar',
                    currencyLocale: dto.currencyLocale || 'en-US',
                    timezoneValue: dto.timezoneValue || 'Asia/Kolkata',
                    timezoneLabel: dto.timezoneLabel || 'India Standard Time',
                    timezoneOffset: dto.timezoneOffset || 'UTC+5:30',
                },
            });
        } else {
            // Update existing settings
            settings = await this.prisma.storeSettings.update({
                where: { id: settings.id },
                data: {
                    ...(dto.storeName && { storeName: dto.storeName }),
                    ...(dto.logo !== undefined && { logo: dto.logo }),
                    ...(dto.currencyCode && { currencyCode: dto.currencyCode }),
                    ...(dto.currencySymbol && { currencySymbol: dto.currencySymbol }),
                    ...(dto.currencyName && { currencyName: dto.currencyName }),
                    ...(dto.currencyLocale && { currencyLocale: dto.currencyLocale }),
                    ...(dto.timezoneValue && { timezoneValue: dto.timezoneValue }),
                    ...(dto.timezoneLabel && { timezoneLabel: dto.timezoneLabel }),
                    ...(dto.timezoneOffset && { timezoneOffset: dto.timezoneOffset }),
                },
            });
        }

        return settings;
    }
}
