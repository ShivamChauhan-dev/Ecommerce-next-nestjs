'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFormatPrice } from '@/stores/settings-store';

interface Order {
    id: string;
    customer: string;
    email: string;
    amount: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    date: string;
}

interface RecentOrdersProps {
    orders: Order[];
}

const statusColors = {
    pending: 'bg-[#ECB018] text-white',
    confirmed: 'bg-[#8684D4] text-white',
    processing: 'bg-[#4856DA] text-white',
    shipped: 'bg-[#1F1F1F] text-white',
    delivered: 'bg-[#3DAB25] text-white',
    cancelled: 'bg-[#DB4444] text-white',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
    const formatPrice = useFormatPrice();

    return (
        <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-[#1F1F1F]">
                    Recent Orders
                </CardTitle>
                <a href="/orders" className="text-sm font-medium text-[#1F1F1F] hover:underline">
                    View all
                </a>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {orders.length === 0 ? (
                        <p className="text-center text-[#696C70] py-8">No recent orders</p>
                    ) : (
                        orders.map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-[#F7F7F7] hover:bg-[#E9E9E9] transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="font-medium text-[#1F1F1F]">{order.customer}</p>
                                    <p className="text-sm text-[#696C70]">{order.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-[#1F1F1F]">{formatPrice(order.amount)}</p>
                                    <p className="text-xs text-[#696C70]">{order.date}</p>
                                </div>
                                <Badge className={cn('ml-4 rounded-lg', statusColors[order.status])}>
                                    {order.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
