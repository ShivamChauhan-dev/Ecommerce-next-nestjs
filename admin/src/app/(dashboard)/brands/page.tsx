'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    productsCount: number;
}

export default function BrandsPage() {
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; brand: Brand | null }>({
        open: false,
        mode: 'add',
        brand: null,
    });
    const [formData, setFormData] = useState({ name: '', logo: '' });

    const { data: brands = [], isLoading } = useQuery({
        queryKey: ['brands'],
        queryFn: async () => {
            const response = await api.get('/admin/brands');
            const apiBrands = response.data.brands || response.data;
            if (Array.isArray(apiBrands)) {
                return apiBrands.map((b: any): Brand => ({
                    id: b.id,
                    name: b.name,
                    slug: b.slug,
                    logo: b.image || b.logo,
                    productsCount: b._count?.products || b.productsCount || 0,
                }));
            }
            return [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: { name: string }) => {
            await api.post('/admin/brands', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            setDialog({ open: false, mode: 'add', brand: null });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name: string } }) => {
            await api.put(`/admin/brands/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
            setDialog({ open: false, mode: 'add', brand: null });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/brands/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['brands'] });
        },
    });

    const openAddDialog = () => {
        setFormData({ name: '', logo: '' });
        setDialog({ open: true, mode: 'add', brand: null });
    };

    const openEditDialog = (brand: Brand) => {
        setFormData({ name: brand.name, logo: brand.logo || '' });
        setDialog({ open: true, mode: 'edit', brand });
    };

    const handleSubmit = () => {
        if (dialog.mode === 'add') {
            createMutation.mutate(formData);
        } else if (dialog.brand) {
            updateMutation.mutate({ id: dialog.brand.id, data: formData });
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Brand',
            render: (brand: Brand) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#F7F7F7] flex items-center justify-center font-bold text-[#1F1F1F]">
                        {brand.name[0]}
                    </div>
                    <span className="font-medium text-[#1F1F1F]">{brand.name}</span>
                </div>
            ),
        },
        { key: 'slug', label: 'Slug', render: (brand: Brand) => <code className="bg-[#F7F7F7] px-2 py-1 rounded text-sm">{brand.slug}</code> },
        { key: 'productsCount', label: 'Products' },
        {
            key: 'actions',
            label: 'Actions',
            render: (brand: Brand) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => openEditDialog(brand)}>
                            <Pencil size={16} className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg text-[#DB4444]" onClick={() => deleteMutation.mutate(brand.id)}>
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
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Brands</h1>
                <p className="text-[#696C70]">Manage product brands</p>
            </div>

            <DataTable data={brands} columns={columns} title="All Brands" searchPlaceholder="Search brands..." onAdd={openAddDialog} addButtonLabel="Add Brand" isLoading={isLoading} />

            <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{dialog.mode === 'add' ? 'Add Brand' : 'Edit Brand'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" placeholder="Brand name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Logo URL (optional)</Label>
                            <Input value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} className="rounded-xl" placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                        <Button className="rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F]" onClick={handleSubmit}>
                            {dialog.mode === 'add' ? 'Create' : 'Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
