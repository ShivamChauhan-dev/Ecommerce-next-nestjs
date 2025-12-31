import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TaxService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all tax rates
     */
    async getAllTaxRates() {
        return (this.prisma as any).taxRate.findMany({
            where: { isActive: true },
        });
    }

    /**
     * Get tax rate by region
     */
    async getTaxRateByRegion(region: string) {
        return (this.prisma as any).taxRate.findFirst({
            where: { region, isActive: true },
        });
    }

    /**
     * Calculate tax for an order
     */
    async calculateTax(
        subtotal: number,
        region?: string,
    ): Promise<{ taxAmount: number; taxRate: number; taxName: string }> {
        // Try to find region-specific tax rate
        let taxRate;
        if (region) {
            taxRate = await (this.prisma as any).taxRate.findFirst({
                where: { region, isActive: true },
            });
        }

        // Fall back to default tax rate (no region)
        if (!taxRate) {
            taxRate = await (this.prisma as any).taxRate.findFirst({
                where: { region: null, isActive: true },
            });
        }

        // If no tax rate found, return 0
        if (!taxRate) {
            return { taxAmount: 0, taxRate: 0, taxName: 'No Tax' };
        }

        const taxAmount = (subtotal * taxRate.rate) / 100;

        return {
            taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
            taxRate: taxRate.rate,
            taxName: taxRate.name,
        };
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Create tax rate
     */
    async createTaxRate(data: {
        name: string;
        rate: number;
        region?: string;
    }) {
        return (this.prisma as any).taxRate.create({
            data: {
                name: data.name,
                rate: data.rate,
                region: data.region || null,
                isActive: true,
            },
        });
    }

    /**
     * Update tax rate
     */
    async updateTaxRate(
        id: string,
        data: { name?: string; rate?: number; region?: string; isActive?: boolean },
    ) {
        const taxRate = await (this.prisma as any).taxRate.findUnique({
            where: { id },
        });

        if (!taxRate) {
            throw new NotFoundException('Tax rate not found');
        }

        return (this.prisma as any).taxRate.update({
            where: { id },
            data,
        });
    }

    /**
     * Delete tax rate
     */
    async deleteTaxRate(id: string) {
        const taxRate = await (this.prisma as any).taxRate.findUnique({
            where: { id },
        });

        if (!taxRate) {
            throw new NotFoundException('Tax rate not found');
        }

        await (this.prisma as any).taxRate.delete({
            where: { id },
        });

        return { message: 'Tax rate deleted' };
    }
}
