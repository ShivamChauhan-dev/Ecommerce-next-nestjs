'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DotsThree, Eye, XCircle } from '@phosphor-icons/react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useFormatPrice } from '@/stores/settings-store';

interface Order {
    id: string;
    orderNumber: string;
    customer: string;
    email: string;
    total: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    items: number;
    date: string;
}

const statusColors = {
    pending: 'bg-[#ECB018] text-white',
    confirmed: 'bg-[#8684D4] text-white',
    processing: 'bg-[#4856DA] text-white',
    shipped: 'bg-[#1F1F1F] text-white',
    delivered: 'bg-[#3DAB25] text-white',
    cancelled: 'bg-[#DB4444] text-white',
};

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const formatPrice = useFormatPrice();

    // Fetch orders from admin API
    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await api.get('/admin/orders');
            const apiOrders = response.data.orders || response.data;
            if (Array.isArray(apiOrders)) {
                return apiOrders.map((o: any): Order => ({
                    id: o.id,
                    orderNumber: o.orderNumber || `ORD-${o.id.substring(0, 6)}`,
                    customer: o.user?.firstName ? `${o.user.firstName} ${o.user.lastName}` : 'Customer',
                    email: o.user?.email || 'N/A',
                    total: o.total,
                    status: o.status as Order['status'],
                    items: o.items?.length || o.itemCount || 0,
                    date: o.createdAt,
                }));
            }
            return [];
        },
    });

    // Update status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            await api.put(`/admin/orders/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });

    const columns = [
        {
            key: 'orderNumber',
            label: 'Order',
            render: (order: Order) => (
                <span className="font-medium text-[#1F1F1F]">{order.orderNumber}</span>
            ),
        },
        {
            key: 'customer',
            label: 'Customer',
            render: (order: Order) => (
                <div>
                    <p className="font-medium text-[#1F1F1F]">{order.customer}</p>
                    <p className="text-xs text-[#696C70]">{order.email}</p>
                </div>
            ),
        },
        {
            key: 'date',
            label: 'Date',
            render: (order: Order) => (
                <span className="text-[#696C70]">
                    {new Date(order.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </span>
            ),
        },
        {
            key: 'items',
            label: 'Items',
        },
        {
            key: 'total',
            label: 'Total',
            render: (order: Order) => (
                <span className="font-medium text-[#1F1F1F]">{formatPrice(order.total)}</span>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (order: Order) => (
                <Select
                    value={order.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: order.id, status: value })}
                >
                    <SelectTrigger className={cn('w-32 h-8 rounded-lg border-0', statusColors[order.status])}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        {orderStatuses.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                                {status}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (order: Order) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onClick={() => router.push(`/orders/${order.id}`)}
                        >
                            <Eye size={16} className="mr-2" />
                            View Details
                        </DropdownMenuItem>
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <DropdownMenuItem
                                className="cursor-pointer rounded-lg text-[#DB4444] focus:text-[#DB4444]"
                                onClick={() => updateStatusMutation.mutate({ id: order.id, status: 'cancelled' })}
                            >
                                <XCircle size={16} className="mr-2" />
                                Cancel Order
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Orders</h1>
                <p className="text-[#696C70]">Manage customer orders and shipments</p>
            </div>

            <DataTable
                data={orders}
                columns={columns}
                title="All Orders"
                searchPlaceholder="Search orders..."
                isLoading={isLoading}
            />
        </div>
    );
}
