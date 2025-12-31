import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get user notifications
     */
    async getUserNotifications(
        userId: string,
        params: { skip?: number; take?: number; unreadOnly?: boolean },
    ) {
        const where: any = { userId };
        if (params.unreadOnly) {
            where.isRead = false;
        }

        const [notifications, total] = await Promise.all([
            (this.prisma as any).notification.findMany({
                where,
                skip: params.skip || 0,
                take: params.take || 20,
                orderBy: { createdAt: 'desc' },
            }),
            (this.prisma as any).notification.count({ where }),
        ]);

        const unreadCount = await (this.prisma as any).notification.count({
            where: { userId, isRead: false },
        });

        return {
            notifications,
            total,
            unreadCount,
        };
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string) {
        const notification = await (this.prisma as any).notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return (this.prisma as any).notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string) {
        await (this.prisma as any).notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });

        return { message: 'All notifications marked as read' };
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId: string, userId: string) {
        const notification = await (this.prisma as any).notification.findFirst({
            where: { id: notificationId, userId },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        await (this.prisma as any).notification.delete({
            where: { id: notificationId },
        });

        return { message: 'Notification deleted' };
    }

    /**
     * Create notification (internal use)
     */
    async createNotification(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        data?: any;
    }) {
        return (this.prisma as any).notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                title: data.title,
                message: data.message,
                data: data.data,
            },
        });
    }

    /**
     * Create notifications for multiple users (batch)
     */
    async createBulkNotifications(
        userIds: string[],
        notification: { type: string; title: string; message: string; data?: any },
    ) {
        const notifications = userIds.map((userId) => ({
            userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
        }));

        await (this.prisma as any).notification.createMany({
            data: notifications,
        });

        return { message: `${userIds.length} notifications created` };
    }
}
