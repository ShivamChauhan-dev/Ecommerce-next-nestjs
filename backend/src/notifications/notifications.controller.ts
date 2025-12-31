import {
    Controller,
    Get,
    Put,
    Delete,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt.strategy';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    /**
     * Get user notifications
     * GET /notifications
     */
    @Get()
    async getUserNotifications(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('unreadOnly') unreadOnly?: string,
    ) {
        const userId = req.user.sub || req.user.id;
        const take = limit ? parseInt(limit, 10) : 20;
        const skip = page ? (parseInt(page, 10) - 1) * take : 0;

        return this.notificationsService.getUserNotifications(userId, {
            skip,
            take,
            unreadOnly: unreadOnly === 'true',
        });
    }

    /**
     * Mark notification as read
     * PUT /notifications/:id/read
     */
    @Put(':id/read')
    async markAsRead(@Request() req, @Param('id') id: string) {
        const userId = req.user.sub || req.user.id;
        return this.notificationsService.markAsRead(id, userId);
    }

    /**
     * Mark all notifications as read
     * PUT /notifications/read-all
     */
    @Put('read-all')
    async markAllAsRead(@Request() req) {
        const userId = req.user.sub || req.user.id;
        return this.notificationsService.markAllAsRead(userId);
    }

    /**
     * Delete notification
     * DELETE /notifications/:id
     */
    @Delete(':id')
    async deleteNotification(@Request() req, @Param('id') id: string) {
        const userId = req.user.sub || req.user.id;
        return this.notificationsService.deleteNotification(id, userId);
    }
}
