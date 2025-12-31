import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import {
    CreateShippingZoneDto,
    UpdateShippingZoneDto,
    CalculateShippingDto,
} from './dto/shipping.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('shipping')
export class ShippingController {
    constructor(private readonly shippingService: ShippingService) { }

    // ==================== PUBLIC ENDPOINTS ====================

    /**
     * Check if pincode is serviceable
     * GET /shipping/check/:pincode
     */
    @Get('check/:pincode')
    async checkServiceability(@Param('pincode') pincode: string) {
        return this.shippingService.checkServiceability(pincode);
    }

    /**
     * Calculate shipping cost
     * POST /shipping/calculate
     */
    @Post('calculate')
    async calculateShipping(@Body() dto: CalculateShippingDto) {
        return this.shippingService.calculateShipping(dto);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all shipping zones
     * GET /shipping/zones
     */
    @Get('zones')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getAllZones(@Query('includeInactive') includeInactive?: string) {
        return this.shippingService.getAllZones(includeInactive === 'true');
    }

    /**
     * Get zone by ID
     * GET /shipping/zones/:id
     */
    @Get('zones/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getZoneById(@Param('id') id: string) {
        return this.shippingService.getZoneById(id);
    }

    /**
     * Create shipping zone
     * POST /shipping/zones
     */
    @Post('zones')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async createZone(@Body() dto: CreateShippingZoneDto) {
        return this.shippingService.createZone(dto);
    }

    /**
     * Update shipping zone
     * PUT /shipping/zones/:id
     */
    @Put('zones/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async updateZone(@Param('id') id: string, @Body() dto: UpdateShippingZoneDto) {
        return this.shippingService.updateZone(id, dto);
    }

    /**
     * Delete shipping zone
     * DELETE /shipping/zones/:id
     */
    @Delete('zones/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async deleteZone(@Param('id') id: string) {
        return this.shippingService.deleteZone(id);
    }

    /**
     * Add pincodes to zone
     * POST /shipping/zones/:id/pincodes
     */
    @Post('zones/:id/pincodes')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async addPincodes(
        @Param('id') id: string,
        @Body('pincodes') pincodes: string[],
    ) {
        return this.shippingService.addPincodes(id, pincodes);
    }

    /**
     * Remove pincodes from zone
     * DELETE /shipping/zones/:id/pincodes
     */
    @Delete('zones/:id/pincodes')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async removePincodes(
        @Param('id') id: string,
        @Body('pincodes') pincodes: string[],
    ) {
        return this.shippingService.removePincodes(id, pincodes);
    }
}
