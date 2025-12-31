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

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    productsCount: number;
}

export default function CategoriesPage() {
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; category: Category | null }>({
        open: false,
        mode: 'add',
        category: null,
    });
    const [formData, setFormData] = useState({ name: '', description: '' });

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/admin/categories');
            const apiCategories = response.data.categories || response.data;
            if (Array.isArray(apiCategories)) {
                return apiCategories.map((c: any): Category => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    description: c.description || '',
                    productsCount: c._count?.products || c.productsCount || 0,
                }));
            }
            return [];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: { name: string; description: string }) => {
            await api.post('/admin/categories', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setDialog({ open: false, mode: 'add', category: null });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name: string; description: string } }) => {
            await api.put(`/admin/categories/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setDialog({ open: false, mode: 'add', category: null });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const openAddDialog = () => {
        setFormData({ name: '', description: '' });
        setDialog({ open: true, mode: 'add', category: null });
    };

    const openEditDialog = (category: Category) => {
        setFormData({ name: category.name, description: category.description });
        setDialog({ open: true, mode: 'edit', category });
    };

    const handleSubmit = () => {
        if (dialog.mode === 'add') {
            createMutation.mutate(formData);
        } else if (dialog.category) {
            updateMutation.mutate({ id: dialog.category.id, data: formData });
        }
    };

    const columns = [
        { key: 'name', label: 'Name', render: (cat: Category) => <span className="font-medium text-[#1F1F1F]">{cat.name}</span> },
        { key: 'slug', label: 'Slug', render: (cat: Category) => <code className="bg-[#F7F7F7] px-2 py-1 rounded text-sm">{cat.slug}</code> },
        { key: 'description', label: 'Description' },
        { key: 'productsCount', label: 'Products' },
        {
            key: 'actions',
            label: 'Actions',
            render: (cat: Category) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => openEditDialog(cat)}>
                            <Pencil size={16} className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg text-[#DB4444]" onClick={() => deleteMutation.mutate(cat.id)}>
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
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Categories</h1>
                <p className="text-[#696C70]">Organize products into categories</p>
            </div>

            <DataTable data={categories} columns={columns} title="All Categories" searchPlaceholder="Search categories..." onAdd={openAddDialog} addButtonLabel="Add Category" isLoading={isLoading} />

            <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{dialog.mode === 'add' ? 'Add Category' : 'Edit Category'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" placeholder="Category name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="rounded-xl" placeholder="Category description" />
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
