import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CmsService {
    constructor(private prisma: PrismaService) { }

    async getBanners(position?: string) {
        const where: any = {};
        if (position) {
            where.position = position;
        }
        return this.prisma.banner.findMany({ where });
    }

    async getTestimonials() {
        return this.prisma.testimonial.findMany();
    }

    async getBrands() {
        return this.prisma.brand.findMany();
    }
}
