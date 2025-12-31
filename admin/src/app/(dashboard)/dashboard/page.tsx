'use client';

import { StatsCard } from '@/components/stats-card';
import { SalesChart } from '@/components/charts/sales-chart';
import { RecentOrders } from '@/components/recent-orders';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function DashboardPage() {
    // Fetch stats from API
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/dashboard');
            const data = response.data;
            return {
                revenue: data.totalRevenue || 0,
                orders: data.totalOrders || 0,
                users: data.totalUsers || 0,
                products: data.totalProducts || 0,
            };
        },
    });

    // Fetch recent orders
    const { data: recentOrdersData = [] } = useQuery({
        queryKey: ['recent-orders'],
        queryFn: async () => {
            const response = await api.get('/admin/orders?take=5');
            const orders = response.data.orders || response.data;
            if (Array.isArray(orders)) {
                return orders.map((order: any) => ({
                    id: order.id,
                    customer: order.user?.firstName ? `${order.user.firstName} ${order.user.lastName}` : 'Customer',
                    email: order.user?.email || 'N/A',
                    amount: order.total,
                    status: order.status,
                    date: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                }));
            }
            return [];
        },
    });

    // Chart data - fetch from API or use empty
    const chartData = [
        { name: 'Jan', sales: 0, orders: 0 },
        { name: 'Feb', sales: 0, orders: 0 },
        { name: 'Mar', sales: 0, orders: 0 },
        { name: 'Apr', sales: 0, orders: 0 },
        { name: 'May', sales: 0, orders: 0 },
        { name: 'Jun', sales: 0, orders: 0 },
        { name: 'Jul', sales: 0, orders: 0 },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Dashboard</h1>
                <p className="text-[#696C70]">Welcome back! Here's your store overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Revenue"
                    value={`$${(stats?.revenue || 0).toLocaleString()}`}
                    change={12.5}
                    changeLabel="vs last month"
                    icon="revenue"
                />
                <StatsCard
                    title="Total Orders"
                    value={stats?.orders?.toLocaleString() || '0'}
                    change={8.2}
                    changeLabel="vs last month"
                    icon="orders"
                />
                <StatsCard
                    title="Total Users"
                    value={stats?.users?.toLocaleString() || '0'}
                    change={5.7}
                    changeLabel="vs last month"
                    icon="users"
                />
                <StatsCard
                    title="Products"
                    value={stats?.products?.toLocaleString() || '0'}
                    change={-2.3}
                    changeLabel="vs last month"
                    icon="products"
                />
            </div>

            {/* Charts & Recent Orders */}
            <div className="grid gap-6 lg:grid-cols-2">
                <SalesChart data={chartData} />
                <RecentOrders orders={recentOrdersData} />
            </div>
        </div>
    );
}
