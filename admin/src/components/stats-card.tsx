'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    TrendUp,
    TrendDown,
    CurrencyDollar,
    ShoppingCart,
    Users,
    Package
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: 'revenue' | 'orders' | 'users' | 'products';
}

const iconMap = {
    revenue: CurrencyDollar,
    orders: ShoppingCart,
    users: Users,
    products: Package,
};

const bgColorMap = {
    revenue: 'bg-[#D2EF9A]',
    orders: 'bg-[#8684D4]',
    users: 'bg-[#ECB018]',
    products: 'bg-[#F4407D]',
};

export function StatsCard({ title, value, change, changeLabel, icon }: StatsCardProps) {
    const Icon = iconMap[icon];
    const isPositive = change && change > 0;
    const isNegative = change && change < 0;

    return (
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-[#696C70]">{title}</CardTitle>
                <div className={cn('p-2.5 rounded-xl', bgColorMap[icon])}>
                    <Icon size={20} weight="bold" className="text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-[#1F1F1F]">{value}</div>
                {change !== undefined && (
                    <div className="flex items-center gap-1 mt-2 text-sm">
                        {isPositive && <TrendUp size={16} className="text-[#3DAB25]" weight="bold" />}
                        {isNegative && <TrendDown size={16} className="text-[#DB4444]" weight="bold" />}
                        <span
                            className={cn(
                                'font-medium',
                                isPositive && 'text-[#3DAB25]',
                                isNegative && 'text-[#DB4444]',
                                !isPositive && !isNegative && 'text-[#696C70]'
                            )}
                        >
                            {isPositive && '+'}
                            {change}%
                        </span>
                        {changeLabel && (
                            <span className="text-[#696C70]">{changeLabel}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
