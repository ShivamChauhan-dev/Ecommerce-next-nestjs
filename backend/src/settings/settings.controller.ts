import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateStoreSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    /**
     * Get store settings (public - needed for frontend)
     */
    @Get()
    async getSettings() {
        return this.settingsService.getSettings();
    }

    /**
     * Update store settings (admin only)
     */
    @Put()
    @UseGuards(JwtAuthGuard, AdminGuard)
    async updateSettings(@Body() dto: UpdateStoreSettingsDto) {
        return this.settingsService.updateSettings(dto);
    }
}
