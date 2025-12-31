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
import { TaxService } from './tax.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('tax')
export class TaxController {
    constructor(private readonly taxService: TaxService) { }

    /**
     * Get all tax rates
     * GET /tax
     */
    @Get()
    async getAllTaxRates() {
        return this.taxService.getAllTaxRates();
    }

    /**
     * Calculate tax
     * GET /tax/calculate?subtotal=1000&region=IN
     */
    @Get('calculate')
    async calculateTax(
        @Query('subtotal') subtotal: string,
        @Query('region') region?: string,
    ) {
        return this.taxService.calculateTax(parseFloat(subtotal), region);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Create tax rate (Admin)
     * POST /tax/admin
     */
    @Post('admin')
    @UseGuards(JwtAuthGuard)
    async createTaxRate(
        @Body() body: { name: string; rate: number; region?: string },
    ) {
        return this.taxService.createTaxRate(body);
    }

    /**
     * Update tax rate (Admin)
     * PUT /tax/admin/:id
     */
    @Put('admin/:id')
    @UseGuards(JwtAuthGuard)
    async updateTaxRate(
        @Param('id') id: string,
        @Body() body: { name?: string; rate?: number; region?: string; isActive?: boolean },
    ) {
        return this.taxService.updateTaxRate(id, body);
    }

    /**
     * Delete tax rate (Admin)
     * DELETE /tax/admin/:id
     */
    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard)
    async deleteTaxRate(@Param('id') id: string) {
        return this.taxService.deleteTaxRate(id);
    }
}
