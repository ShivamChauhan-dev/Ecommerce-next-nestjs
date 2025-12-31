'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    SquaresFour,
    Package,
    ShoppingCart,
    Users,
    Folders,
    Buildings,
    Ticket,
    Star,
    Truck,
    CurrencyDollar,
    GearSix,
    CaretLeft,
    CaretRight,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const menuItems = [
    { icon: SquaresFour, label: 'Dashboard', href: '/dashboard' },
    { icon: Package, label: 'Products', href: '/products' },
    { icon: ShoppingCart, label: 'Orders', href: '/orders' },
    { icon: Users, label: 'Users', href: '/users' },
    { icon: Folders, label: 'Categories', href: '/categories' },
    { icon: Buildings, label: 'Brands', href: '/brands' },
    { icon: Ticket, label: 'Coupons', href: '/coupons' },
    { icon: Star, label: 'Reviews', href: '/reviews' },
    { icon: Truck, label: 'Shipping', href: '/shipping' },
    { icon: CurrencyDollar, label: 'Tax Rates', href: '/tax' },
    { icon: GearSix, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
                collapsed ? 'w-[72px]' : 'w-[260px]'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1F1F1F] text-white font-bold">
                        A
                    </div>
                    {!collapsed && (
                        <span className="text-xl font-semibold text-[#1F1F1F]">Anvogue</span>
                    )}
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-3">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-[#1F1F1F] text-white'
                                    : 'text-[#696C70] hover:bg-[#D2EF9A] hover:text-[#1F1F1F]',
                                collapsed && 'justify-center px-2'
                            )}
                        >
                            <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
