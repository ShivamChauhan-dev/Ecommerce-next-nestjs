'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DotsThree, UserCircle, Trash, ShieldCheck, Eye } from '@phosphor-icons/react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'USER' | 'ADMIN';
    status: 'active' | 'inactive';
    avatar?: string;
    createdAt: string;
    ordersCount: number;
}

const roleColors = {
    USER: 'bg-[#8684D4] text-white',
    ADMIN: 'bg-[#D2EF9A] text-[#1F1F1F]',
};

const statusColors = {
    active: 'bg-[#3DAB25] text-white',
    inactive: 'bg-[#696C70] text-white',
};

export default function UsersPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
        open: false,
        user: null,
    });

    // Fetch users from admin API
    const { data: users = [], isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/admin/users');
            const apiUsers = response.data.users || response.data;
            if (Array.isArray(apiUsers)) {
                return apiUsers.map((u: any): User => ({
                    id: u.id,
                    firstName: u.firstName || 'User',
                    lastName: u.lastName || '',
                    email: u.email,
                    role: u.role as User['role'],
                    status: u.emailVerified !== false ? 'active' : 'inactive',
                    avatar: u.avatar,
                    createdAt: u.createdAt,
                    ordersCount: u._count?.orders || u.ordersCount || 0,
                }));
            }
            return [];
        },
    });

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string; role: string }) => {
            await api.put(`/admin/users/${id}/role`, { role });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    // Deactivate user mutation
    const deactivateMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.put(`/admin/users/${id}/deactivate`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    // Delete user mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setDeleteDialog({ open: false, user: null });
        },
    });

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    };

    const columns = [
        {
            key: 'name',
            label: 'User',
            render: (user: User) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-[#D2EF9A] text-[#1F1F1F] font-semibold text-sm">
                            {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium text-[#1F1F1F]">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-[#696C70]">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (user: User) => (
                <Badge className={cn('rounded-lg', roleColors[user.role])}>
                    {user.role}
                </Badge>
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (user: User) => (
                <Badge className={cn('rounded-lg capitalize', statusColors[user.status])}>
                    {user.status}
                </Badge>
            ),
        },
        {
            key: 'ordersCount',
            label: 'Orders',
        },
        {
            key: 'createdAt',
            label: 'Joined',
            render: (user: User) => (
                <span className="text-[#696C70]">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (user: User) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onClick={() => router.push(`/users/${user.id}`)}
                        >
                            <Eye size={16} className="mr-2" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onClick={() => updateRoleMutation.mutate({
                                id: user.id,
                                role: user.role === 'ADMIN' ? 'USER' : 'ADMIN'
                            })}
                        >
                            <ShieldCheck size={16} className="mr-2" />
                            {user.role === 'ADMIN' ? 'Remove Admin' : 'Make Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onClick={() => deactivateMutation.mutate(user.id)}
                        >
                            <UserCircle size={16} className="mr-2" />
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg text-[#DB4444] focus:text-[#DB4444]"
                            onClick={() => setDeleteDialog({ open: true, user })}
                        >
                            <Trash size={16} className="mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Users</h1>
                <p className="text-[#696C70]">Manage user accounts and permissions</p>
            </div>

            <DataTable
                data={users}
                columns={columns}
                title="All Users"
                searchPlaceholder="Search users..."
                isLoading={isLoading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteDialog.user?.firstName} {deleteDialog.user?.lastName}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setDeleteDialog({ open: false, user: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl bg-[#DB4444] text-white hover:bg-[#c13d3d]"
                            onClick={() => deleteDialog.user && deleteMutation.mutate(deleteDialog.user.id)}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
