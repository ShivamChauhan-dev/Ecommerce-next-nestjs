'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, SignOut, User, MagnifyingGlass } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

export function Header() {
    const { user, logout } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const getInitials = (firstName?: string, lastName?: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'A';
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white px-6">
            {/* Search */}
            <div className="relative w-full max-w-md">
                <MagnifyingGlass
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#696C70]"
                />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-10 bg-[#F7F7F7] border-transparent focus:border-[#1F1F1F] rounded-xl"
                />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative rounded-xl">
                    <Bell size={20} className="text-[#696C70]" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DB4444] text-[10px] text-white">
                        3
                    </span>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 rounded-xl px-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.avatar} />
                                <AvatarFallback className="bg-[#D2EF9A] text-[#1F1F1F] font-semibold text-sm">
                                    {getInitials(user?.firstName, user?.lastName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden text-left md:block">
                                <p className="text-sm font-medium text-[#1F1F1F]">
                                    {user?.firstName} {user?.lastName}
                                </p>
                                <p className="text-xs text-[#696C70]">{user?.role}</p>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer rounded-lg">
                            <User size={16} className="mr-2" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg text-[#DB4444] focus:text-[#DB4444]"
                            onClick={handleLogout}
                        >
                            <SignOut size={16} className="mr-2" />
                            Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
