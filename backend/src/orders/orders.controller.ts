import { Body, Controller, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto } from './dto/orders.dto';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    createOrder(@Request() req, @Body() dto: CreateOrderDto) {
        return this.ordersService.createOrder(req.user.userId, dto);
    }

    @Get()
    getMyOrders(@Request() req) {
        return this.ordersService.getMyOrders(req.user.userId);
    }

    @Get(':id')
    getOrderById(@Request() req, @Param('id') id: string) {
        return this.ordersService.getOrderById(req.user.userId, id);
    }

    /**
     * Cancel order (user)
     */
    @Put(':id/cancel')
    cancelOrder(@Request() req, @Param('id') id: string) {
        return this.ordersService.cancelOrder(id, req.user.userId);
    }

    // ==================== ADMIN ENDPOINTS ====================

    /**
     * Get all orders (admin)
     */
    @Get('admin/all')
    getAllOrders(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Query('paymentStatus') paymentStatus?: string,
    ) {
        return this.ordersService.getAllOrders({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            paymentStatus,
        });
    }

    /**
     * Get order stats (admin)
     */
    @Get('admin/stats')
    getOrderStats() {
        return this.ordersService.getOrderStats();
    }

    /**
     * Get order by ID (admin)
     */
    @Get('admin/:id')
    getOrderByIdAdmin(@Param('id') id: string) {
        return this.ordersService.getOrderByIdAdmin(id);
    }

    /**
     * Update order status (admin)
     */
    @Put('admin/:id/status')
    updateOrderStatus(
        @Param('id') id: string,
        @Body('status') status: string,
    ) {
        return this.ordersService.updateOrderStatus(id, status);
    }

    /**
     * Cancel order (admin)
     */
    @Put('admin/:id/cancel')
    cancelOrderAdmin(@Param('id') id: string) {
        return this.ordersService.cancelOrder(id);
    }
}

