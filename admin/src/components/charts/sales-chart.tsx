'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SalesChartProps {
    data: Array<{
        name: string;
        sales: number;
        orders: number;
    }>;
}

export function SalesChart({ data }: SalesChartProps) {
    return (
        <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#1F1F1F]">
                    Sales Overview
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D2EF9A" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#D2EF9A" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8684D4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8684D4" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E9E9E9" />
                            <XAxis
                                dataKey="name"
                                stroke="#696C70"
                                tick={{ fill: '#696C70', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#696C70"
                                tick={{ fill: '#696C70', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(43, 52, 74, 0.12)',
                                }}
                                labelStyle={{ color: '#1F1F1F', fontWeight: 600 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="#1F1F1F"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#salesGradient)"
                                name="Sales ($)"
                            />
                            <Area
                                type="monotone"
                                dataKey="orders"
                                stroke="#8684D4"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#ordersGradient)"
                                name="Orders"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
