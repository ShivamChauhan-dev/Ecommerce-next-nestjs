import { Controller, Get, Query } from '@nestjs/common';
import { CmsService } from './cms.service';

@Controller('cms')
export class CmsController {
    constructor(private readonly cmsService: CmsService) { }

    @Get('banners')
    async getBanners(@Query('position') position?: string) {
        return this.cmsService.getBanners(position);
    }

    @Get('testimonials')
    async getTestimonials() {
        return this.cmsService.getTestimonials();
    }

    @Get('brands')
    async getBrands() {
        return this.cmsService.getBrands();
    }
}
