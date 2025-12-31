'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Package, MapPin, Envelope, Phone, Calendar, ShoppingCart } from '@phosphor-icons/react';
import api from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserOrder {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    date: string;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: 'USER' | 'ADMIN';
    status: 'active' | 'inactive';
    avatar?: string;
    createdAt: string;
    address?: {
        line1: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    orders: UserOrder[];
    totalSpent: number;
}

const sampleUser: User = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1 234 567 8900',
    role: 'USER',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    address: {
        line1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
    },
    orders: [
        { id: '1', orderNumber: 'ORD-001', total: 299.99, status: 'delivered', date: '2024-12-30' },
        { id: '2', orderNumber: 'ORD-015', total: 149.50, status: 'shipped', date: '2024-12-25' },
        { id: '3', orderNumber: 'ORD-032', total: 89.99, status: 'delivered', date: '2024-12-15' },
    ],
    totalSpent: 539.48,
};

const statusColors = {
    delivered: 'bg-[#3DAB25] text-white',
    shipped: 'bg-[#1F1F1F] text-white',
    processing: 'bg-[#4856DA] text-white',
    pending: 'bg-[#ECB018] text-white',
    cancelled: 'bg-[#DB4444] text-white',
};

export default function UserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const { data: user = sampleUser, isLoading } = useQuery({
        queryKey: ['user', userId],
        queryFn: async () => {
            try {
                const response = await api.get(`/admin/users/${userId}`);
                return response.data;
            } catch {
                return sampleUser;
            }
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1F1F1F] border-t-transparent" />
            </div>
        );
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/users">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft size={20} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-[#1F1F1F]">User Details</h1>
                    <p className="text-[#696C70]">{user.email}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* User Profile */}
                <div className="space-y-6">
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="h-20 w-20 mb-4">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-[#D2EF9A] text-[#1F1F1F] font-bold text-2xl">
                                        {getInitials(user.firstName, user.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <h2 className="text-xl font-semibold text-[#1F1F1F]">
                                    {user.firstName} {user.lastName}
                                </h2>
                                <div className="flex gap-2 mt-2">
                                    <Badge className={cn('rounded-lg', user.role === 'ADMIN' ? 'bg-[#D2EF9A] text-[#1F1F1F]' : 'bg-[#8684D4] text-white')}>
                                        {user.role}
                                    </Badge>
                                    <Badge className={cn('rounded-lg', user.status === 'active' ? 'bg-[#3DAB25] text-white' : 'bg-[#696C70] text-white')}>
                                        {user.status}
                                    </Badge>
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#F7F7F7] rounded-lg">
                                        <Envelope size={16} className="text-[#696C70]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#696C70]">Email</p>
                                        <p className="text-sm font-medium">{user.email}</p>
                                    </div>
                                </div>
                                {user.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#F7F7F7] rounded-lg">
                                            <Phone size={16} className="text-[#696C70]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#696C70]">Phone</p>
                                            <p className="text-sm font-medium">{user.phone}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#F7F7F7] rounded-lg">
                                        <Calendar size={16} className="text-[#696C70]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#696C70]">Joined</p>
                                        <p className="text-sm font-medium">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address */}
                    {user.address && (
                        <Card className="rounded-2xl border-0 shadow-sm">
                            <CardHeader className="flex flex-row items-center gap-3">
                                <div className="p-2 bg-[#ECB018] rounded-xl">
                                    <MapPin size={20} weight="bold" className="text-white" />
                                </div>
                                <CardTitle className="text-lg">Address</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-[#696C70] space-y-1">
                                <p>{user.address.line1}</p>
                                <p>{user.address.city}, {user.address.state} {user.address.postalCode}</p>
                                <p>{user.address.country}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Orders & Stats */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="rounded-2xl border-0 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#D2EF9A] rounded-xl">
                                        <ShoppingCart size={24} weight="bold" className="text-[#1F1F1F]" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#696C70]">Total Orders</p>
                                        <p className="text-2xl font-bold text-[#1F1F1F]">{user.orders.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="rounded-2xl border-0 shadow-sm">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-[#8684D4] rounded-xl">
                                        <Package size={24} weight="bold" className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-[#696C70]">Total Spent</p>
                                        <p className="text-2xl font-bold text-[#1F1F1F]">${user.totalSpent.toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Orders */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Order History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {user.orders.map((order: UserOrder, index: number) => (
                                    <div key={order.id}>
                                        <Link href={`/orders/${order.id}`}>
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-[#F7F7F7] hover:bg-[#E9E9E9] transition-colors cursor-pointer">
                                                <div>
                                                    <p className="font-medium text-[#1F1F1F]">{order.orderNumber}</p>
                                                    <p className="text-sm text-[#696C70]">
                                                        {new Date(order.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="font-semibold text-[#1F1F1F]">${order.total.toFixed(2)}</p>
                                                    <Badge className={cn('rounded-lg capitalize', statusColors[order.status as keyof typeof statusColors] || 'bg-[#696C70]')}>
                                                        {order.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Link>
                                        {index < user.orders.length - 1 && <div className="h-2" />}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
