import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
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
}
