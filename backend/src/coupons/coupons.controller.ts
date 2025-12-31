import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Query,
    Req,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import {
    CreateCouponDto,
    UpdateCouponDto,
    ValidateCouponDto,
} from './dto/coupons.dto';
import { JwtAuthGuard } from '../auth/jwt.strategy';

// Simple admin guard - checks if user role is ADMIN
// In production, move this to a separate file
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        return request.user?.role === 'ADMIN';
    }
}

@Controller('coupons')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) { }

    // ========== ADMIN ENDPOINTS ==========

    /**
     * Create a new coupon (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard, AdminGuard)
    async create(@Body() dto: CreateCouponDto) {
        return this.couponsService.create(dto);
    }

    /**
     * Get all coupons (Admin only)
     */
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async findAll(@Query('includeInactive') includeInactive: string) {
        return this.couponsService.findAll(includeInactive === 'true');
    }

    /**
     * Get coupon details (Admin only)
     */
    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async findOne(@Param('id') id: string) {
        return this.couponsService.findOne(id);
    }

    /**
     * Update coupon (Admin only)
     */
    @Put(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
        return this.couponsService.update(id, dto);
    }

    /**
     * Delete coupon (Admin only)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async delete(@Param('id') id: string) {
        return this.couponsService.delete(id);
    }

    // ========== PUBLIC ENDPOINTS ==========

    /**
     * Validate a coupon code (for cart/checkout)
     */
    @Post('validate')
    async validate(@Body() dto: ValidateCouponDto) {
        return this.couponsService.validate(dto);
    }

    /**
     * Apply coupon with user limit check (requires auth)
     */
    @Post('apply')
    @UseGuards(JwtAuthGuard)
    async apply(@Body() dto: ValidateCouponDto, @Req() req: any) {
        return this.couponsService.apply({
            code: dto.code,
            orderTotal: dto.orderTotal,
            userId: req.user.sub || req.user.id,
        });
    }
}
