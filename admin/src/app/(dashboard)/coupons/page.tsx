'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DotsThree, Pencil, Trash } from '@phosphor-icons/react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Coupon {
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minPurchase: number;
    usageLimit: number;
    usedCount: number;
    expiresAt: string;
    status: 'active' | 'expired' | 'disabled';
}

const statusColors = {
    active: 'bg-[#3DAB25] text-white',
    expired: 'bg-[#696C70] text-white',
    disabled: 'bg-[#DB4444] text-white',
};

export default function CouponsPage() {
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; coupon: Coupon | null }>({
        open: false,
        mode: 'add',
        coupon: null,
    });
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage' as 'percentage' | 'fixed',
        value: 0,
        minPurchase: 0,
        usageLimit: 100,
        expiresAt: '',
    });

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => {
            const response = await api.get('/coupons/admin/all');
            const apiCoupons = response.data.coupons || response.data;
            if (Array.isArray(apiCoupons)) {
                return apiCoupons.map((c: any): Coupon => ({
                    id: c.id,
                    code: c.code,
                    type: c.discountType === 'percentage' ? 'percentage' : 'fixed',
                    value: c.discountValue,
                    minPurchase: c.minOrderValue || 0,
                    usageLimit: c.maxUses || 999,
                    usedCount: c.usedCount || 0,
                    expiresAt: c.validUntil,
                    status: c.isActive ? 'active' : 'disabled',
                }));
            }
            return [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            await api.post('/coupons', {
                code: data.code,
                discountType: data.type,
                discountValue: data.value,
                minOrderValue: data.minPurchase,
                maxUses: data.usageLimit,
                validUntil: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
                isActive: true,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            setDialog({ open: false, mode: 'add', coupon: null });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/coupons/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
        },
    });

    const openAddDialog = () => {
        setFormData({ code: '', type: 'percentage', value: 0, minPurchase: 0, usageLimit: 100, expiresAt: '' });
        setDialog({ open: true, mode: 'add', coupon: null });
    };

    const columns = [
        { key: 'code', label: 'Code', render: (c: Coupon) => <code className="bg-[#D2EF9A] px-3 py-1 rounded-lg font-bold text-[#1F1F1F]">{c.code}</code> },
        {
            key: 'discount',
            label: 'Discount',
            render: (c: Coupon) => <span className="font-medium">{c.type === 'percentage' ? `${c.value}%` : `$${c.value}`}</span>,
        },
        { key: 'minPurchase', label: 'Min. Purchase', render: (c: Coupon) => `$${c.minPurchase}` },
        { key: 'usage', label: 'Usage', render: (c: Coupon) => `${c.usedCount} / ${c.usageLimit}` },
        {
            key: 'expiresAt',
            label: 'Expires',
            render: (c: Coupon) => new Date(c.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        },
        { key: 'status', label: 'Status', render: (c: Coupon) => <Badge className={cn('rounded-lg capitalize', statusColors[c.status])}>{c.status}</Badge> },
        {
            key: 'actions',
            label: 'Actions',
            render: (c: Coupon) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="cursor-pointer rounded-lg text-[#DB4444]" onClick={() => deleteMutation.mutate(c.id)}>
                            <Trash size={16} className="mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Coupons</h1>
                <p className="text-[#696C70]">Manage discount coupons</p>
            </div>

            <DataTable data={coupons} columns={columns} title="All Coupons" searchPlaceholder="Search coupons..." onAdd={openAddDialog} addButtonLabel="Add Coupon" isLoading={isLoading} />

            <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Coupon</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Code</Label>
                            <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="rounded-xl" placeholder="SAVE20" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as 'percentage' | 'fixed' })}>
                                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed ($)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} className="rounded-xl" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min. Purchase ($)</Label>
                                <Input type="number" value={formData.minPurchase} onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Usage Limit</Label>
                                <Input type="number" value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })} className="rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Expires At</Label>
                            <Input type="date" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} className="rounded-xl" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                        <Button className="rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F]" onClick={() => createMutation.mutate(formData)}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
