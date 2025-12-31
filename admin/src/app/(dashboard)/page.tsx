'use client';

import { StatsCard } from '@/components/stats-card';
import { SalesChart } from '@/components/charts/sales-chart';
import { RecentOrders } from '@/components/recent-orders';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// Sample data - replace with actual API calls
const sampleChartData = [
    { name: 'Jan', sales: 4000, orders: 24 },
    { name: 'Feb', sales: 3000, orders: 18 },
    { name: 'Mar', sales: 5000, orders: 32 },
    { name: 'Apr', sales: 4500, orders: 28 },
    { name: 'May', sales: 6000, orders: 45 },
    { name: 'Jun', sales: 5500, orders: 38 },
    { name: 'Jul', sales: 7000, orders: 52 },
];

const sampleOrders = [
    {
        id: '1',
        customer: 'John Doe',
        email: 'john@example.com',
        amount: 299.99,
        status: 'delivered' as const,
        date: 'Dec 30, 2024',
    },
    {
        id: '2',
        customer: 'Jane Smith',
        email: 'jane@example.com',
        amount: 149.50,
        status: 'shipped' as const,
        date: 'Dec 30, 2024',
    },
    {
        id: '3',
        customer: 'Bob Wilson',
        email: 'bob@example.com',
        amount: 499.00,
        status: 'processing' as const,
        date: 'Dec 29, 2024',
    },
    {
        id: '4',
        customer: 'Alice Brown',
        email: 'alice@example.com',
        amount: 89.99,
        status: 'pending' as const,
        date: 'Dec 29, 2024',
    },
    {
        id: '5',
        customer: 'Charlie Davis',
        email: 'charlie@example.com',
        amount: 199.00,
        status: 'confirmed' as const,
        date: 'Dec 28, 2024',
    },
];

export default function DashboardPage() {
    // Fetch stats from API
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            try {
                // Try to fetch real data
                const [salesRes, ordersRes, usersRes] = await Promise.all([
                    api.get('/analytics/sales').catch(() => ({ data: null })),
                    api.get('/orders/admin/stats').catch(() => ({ data: null })),
                    api.get('/admin/users/stats').catch(() => ({ data: null })),
                ]);
                return {
                    revenue: salesRes.data?.totalRevenue || 125430,
                    orders: ordersRes.data?.totalOrders || 1245,
                    users: usersRes.data?.totalUsers || 3280,
                    products: 456,
                };
            } catch {
                // Return sample data if API fails
                return {
                    revenue: 125430,
                    orders: 1245,
                    users: 3280,
                    products: 456,
                };
            }
        },
    });

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
                <SalesChart data={sampleChartData} />
                <RecentOrders orders={sampleOrders} />
            </div>
        </div>
    );
}
