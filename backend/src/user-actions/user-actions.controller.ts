import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { UserActionsService } from './user-actions.service';
import { AuthGuard } from '@nestjs/passport';
import { AddToCartDto, ToggleListDto, UpdateCartItemDto } from './dto/user-actions.dto';

@Controller('user-actions')
@UseGuards(AuthGuard('jwt'))
export class UserActionsController {
    constructor(private readonly userActionsService: UserActionsService) { }

    @Get('cart')
    getCart(@Request() req) {
        return this.userActionsService.getCart(req.user.userId);
    }

    @Post('cart')
    addToCart(@Request() req, @Body() dto: AddToCartDto) {
        return this.userActionsService.addToCart(req.user.userId, dto);
    }

    @Delete('cart/:id')
    removeFromCart(@Request() req, @Param('id') id: string) {
        return this.userActionsService.removeItemFromCart(req.user.userId, id);
    }

    @Patch('cart/:id')
    updateCartItem(@Request() req, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
        return this.userActionsService.updateCartItem(req.user.userId, id, dto);
    }

    @Get('wishlist')
    getWishlist(@Request() req) {
        return this.userActionsService.getWishlist(req.user.userId);
    }

    @Post('wishlist')
    toggleWishlist(@Request() req, @Body() dto: ToggleListDto) {
        return this.userActionsService.toggleWishlist(req.user.userId, dto.productId);
    }

    @Get('compare')
    getCompare(@Request() req) {
        return this.userActionsService.getCompare(req.user.userId);
    }

    @Post('compare')
    toggleCompare(@Request() req, @Body() dto: ToggleListDto) {
        return this.userActionsService.toggleCompare(req.user.userId, dto.productId);
    }
}
