'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Package, MapPin, CreditCard, Truck, User } from '@phosphor-icons/react';
import api from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface OrderItem {
    id: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
    variant?: string;
}

interface Order {
    id: string;
    orderNumber: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    customer: {
        name: string;
        email: string;
        phone?: string;
    };
    shippingAddress: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    createdAt: string;
    notes?: string;
}

const sampleOrder: Order = {
    id: '1',
    orderNumber: 'ORD-001',
    status: 'processing',
    paymentStatus: 'paid',
    customer: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1 234 567 8900',
    },
    shippingAddress: {
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
    },
    items: [
        { id: '1', productName: 'Classic Cotton T-Shirt', quantity: 2, price: 29.99, variant: 'Size: M, Color: White' },
        { id: '2', productName: 'Slim Fit Jeans', quantity: 1, price: 59.99, variant: 'Size: 32' },
        { id: '3', productName: 'Leather Belt', quantity: 1, price: 39.99 },
    ],
    subtotal: 159.96,
    shipping: 9.99,
    tax: 12.80,
    total: 182.75,
    createdAt: '2024-12-30T10:30:00Z',
    notes: 'Please leave at front door',
};

const statusColors = {
    pending: 'bg-[#ECB018] text-white',
    confirmed: 'bg-[#8684D4] text-white',
    processing: 'bg-[#4856DA] text-white',
    shipped: 'bg-[#1F1F1F] text-white',
    delivered: 'bg-[#3DAB25] text-white',
    cancelled: 'bg-[#DB4444] text-white',
};

const paymentStatusColors = {
    pending: 'bg-[#ECB018] text-white',
    paid: 'bg-[#3DAB25] text-white',
    failed: 'bg-[#DB4444] text-white',
    refunded: 'bg-[#696C70] text-white',
};

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const { data: order = sampleOrder, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => {
            try {
                const response = await api.get(`/orders/admin/${orderId}`);
                return response.data;
            } catch {
                return sampleOrder;
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/orders">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold text-[#1F1F1F]">{order.orderNumber}</h1>
                            <Badge className={cn('rounded-lg capitalize', statusColors[order.status])}>
                                {order.status}
                            </Badge>
                        </div>
                        <p className="text-[#696C70]">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl">
                        Print Invoice
                    </Button>
                    <Button className="rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F]">
                        Update Status
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-[#D2EF9A] rounded-xl">
                                <Package size={20} weight="bold" className="text-[#1F1F1F]" />
                            </div>
                            <CardTitle className="text-lg">Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item, index) => (
                                    <div key={item.id}>
                                        <div className="flex items-center justify-between py-3">
                                            <div className="flex items-center gap-4">
                                                <div className="h-16 w-16 rounded-xl bg-[#F7F7F7] flex items-center justify-center">
                                                    {item.productImage ? (
                                                        <img src={item.productImage} alt={item.productName} className="h-16 w-16 rounded-xl object-cover" />
                                                    ) : (
                                                        <span className="text-xs text-[#696C70]">IMG</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#1F1F1F]">{item.productName}</p>
                                                    {item.variant && <p className="text-sm text-[#696C70]">{item.variant}</p>}
                                                    <p className="text-sm text-[#696C70]">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-[#1F1F1F]">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                        {index < order.items.length - 1 && <Separator />}
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Order Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#696C70]">Subtotal</span>
                                    <span>${order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#696C70]">Shipping</span>
                                    <span>${order.shipping.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#696C70]">Tax</span>
                                    <span>${order.tax.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span className="text-[#1F1F1F]">${order.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {order.notes && (
                        <Card className="rounded-2xl border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Order Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-[#696C70]">{order.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Customer */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-[#8684D4] rounded-xl">
                                <User size={20} weight="bold" className="text-white" />
                            </div>
                            <CardTitle className="text-lg">Customer</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="font-medium text-[#1F1F1F]">{order.customer.name}</p>
                            <p className="text-sm text-[#696C70]">{order.customer.email}</p>
                            {order.customer.phone && (
                                <p className="text-sm text-[#696C70]">{order.customer.phone}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-[#ECB018] rounded-xl">
                                <MapPin size={20} weight="bold" className="text-white" />
                            </div>
                            <CardTitle className="text-lg">Shipping Address</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-[#696C70] space-y-1">
                            <p>{order.shippingAddress.line1}</p>
                            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                        </CardContent>
                    </Card>

                    {/* Payment */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-[#3DAB25] rounded-xl">
                                <CreditCard size={20} weight="bold" className="text-white" />
                            </div>
                            <CardTitle className="text-lg">Payment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-[#696C70]">Status</span>
                                <Badge className={cn('rounded-lg capitalize', paymentStatusColors[order.paymentStatus])}>
                                    {order.paymentStatus}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center gap-3">
                            <div className="p-2 bg-[#F4407D] rounded-xl">
                                <Truck size={20} weight="bold" className="text-white" />
                            </div>
                            <CardTitle className="text-lg">Shipping</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-[#696C70]">
                            <p>Standard Shipping</p>
                            <p className="mt-1">Estimated: 3-5 business days</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
