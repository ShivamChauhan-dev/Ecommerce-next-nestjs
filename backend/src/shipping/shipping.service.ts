import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
    CreateShippingZoneDto,
    UpdateShippingZoneDto,
    CalculateShippingDto,
} from './dto/shipping.dto';

@Injectable()
export class ShippingService {
    constructor(private prisma: PrismaService) { }

    // ==================== ZONE MANAGEMENT (ADMIN) ====================

    async createZone(dto: CreateShippingZoneDto) {
        return this.prisma.shippingZone.create({
            data: dto,
        });
    }

    async updateZone(id: string, dto: UpdateShippingZoneDto) {
        const zone = await this.prisma.shippingZone.findUnique({
            where: { id },
        });

        if (!zone) {
            throw new NotFoundException('Shipping zone not found');
        }

        return this.prisma.shippingZone.update({
            where: { id },
            data: dto,
        });
    }

    async deleteZone(id: string) {
        const zone = await this.prisma.shippingZone.findUnique({
            where: { id },
        });

        if (!zone) {
            throw new NotFoundException('Shipping zone not found');
        }

        return this.prisma.shippingZone.delete({
            where: { id },
        });
    }

    async getAllZones(includeInactive = false) {
        return this.prisma.shippingZone.findMany({
            where: includeInactive ? {} : { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async getZoneById(id: string) {
        const zone = await this.prisma.shippingZone.findUnique({
            where: { id },
        });

        if (!zone) {
            throw new NotFoundException('Shipping zone not found');
        }

        return zone;
    }

    // ==================== PUBLIC SHIPPING CALCULATIONS ====================

    /**
     * Check if a pincode is serviceable
     */
    async checkServiceability(pincode: string): Promise<{
        serviceable: boolean;
        zone?: any;
        estimatedDays?: string;
    }> {
        const zone = await this.prisma.shippingZone.findFirst({
            where: {
                isActive: true,
                pincodes: { has: pincode },
            },
        });

        if (!zone) {
            return { serviceable: false };
        }

        return {
            serviceable: true,
            zone: {
                id: zone.id,
                name: zone.name,
                baseCost: zone.baseCost,
                freeAbove: zone.freeAbove,
            },
            estimatedDays:
                zone.minDays === zone.maxDays
                    ? `${zone.minDays} days`
                    : `${zone.minDays}-${zone.maxDays} days`,
        };
    }

    /**
     * Calculate shipping cost for an order
     */
    async calculateShipping(dto: CalculateShippingDto): Promise<{
        cost: number;
        isFree: boolean;
        estimatedDays: string;
        zoneName: string;
    }> {
        const zone = await this.prisma.shippingZone.findFirst({
            where: {
                isActive: true,
                pincodes: { has: dto.pincode },
            },
        });

        if (!zone) {
            throw new BadRequestException(
                `Delivery not available to pincode ${dto.pincode}`,
            );
        }

        // Check if order qualifies for free shipping
        if (zone.freeAbove && dto.orderTotal >= zone.freeAbove) {
            return {
                cost: 0,
                isFree: true,
                estimatedDays:
                    zone.minDays === zone.maxDays
                        ? `${zone.minDays} days`
                        : `${zone.minDays}-${zone.maxDays} days`,
                zoneName: zone.name,
            };
        }

        // Calculate cost: base + (weight * perKgCost)
        const weight = dto.weight || 0;
        const cost = zone.baseCost + weight * zone.perKgCost;

        return {
            cost: Math.round(cost * 100) / 100, // Round to 2 decimals
            isFree: false,
            estimatedDays:
                zone.minDays === zone.maxDays
                    ? `${zone.minDays} days`
                    : `${zone.minDays}-${zone.maxDays} days`,
            zoneName: zone.name,
        };
    }

    /**
     * Add pincodes to a zone
     */
    async addPincodes(id: string, pincodes: string[]) {
        const zone = await this.prisma.shippingZone.findUnique({
            where: { id },
        });

        if (!zone) {
            throw new NotFoundException('Shipping zone not found');
        }

        // Merge and deduplicate pincodes
        const allPincodes = [...new Set([...zone.pincodes, ...pincodes])];

        return this.prisma.shippingZone.update({
            where: { id },
            data: { pincodes: allPincodes },
        });
    }

    /**
     * Remove pincodes from a zone
     */
    async removePincodes(id: string, pincodes: string[]) {
        const zone = await this.prisma.shippingZone.findUnique({
            where: { id },
        });

        if (!zone) {
            throw new NotFoundException('Shipping zone not found');
        }

        const filteredPincodes = zone.pincodes.filter(
            (p) => !pincodes.includes(p),
        );

        return this.prisma.shippingZone.update({
            where: { id },
            data: { pincodes: filteredPincodes },
        });
    }
}
