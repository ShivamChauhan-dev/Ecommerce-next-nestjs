'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { DotsThree, Pencil, Trash, Eye } from '@phosphor-icons/react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useFormatPrice } from '@/stores/settings-store';

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    category: string;
    status: 'active' | 'draft' | 'archived';
    image?: string;
}

const statusColors = {
    active: 'bg-[#3DAB25] text-white',
    draft: 'bg-[#ECB018] text-white',
    archived: 'bg-[#696C70] text-white',
};

export default function ProductsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const formatPrice = useFormatPrice();
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
        open: false,
        product: null,
    });

    // Fetch products from admin API
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await api.get('/admin/products?includeInactive=true');
            const apiProducts = response.data.products || response.data;
            if (Array.isArray(apiProducts)) {
                return apiProducts.map((p: any): Product => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku || `SKU-${p.id.substring(0, 6)}`,
                    price: p.price,
                    stock: p.stock ?? 0,
                    category: p.category?.name || 'Uncategorized',
                    status: (p.isActive ? 'active' : 'draft') as Product['status'],
                    image: p.images?.[0] || p.thumbImage,
                }));
            }
            return [];
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/admin/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setDeleteDialog({ open: false, product: null });
        },
    });

    const columns = [
        {
            key: 'name',
            label: 'Product',
            render: (product: Product) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#F7F7F7] flex items-center justify-center">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                            <span className="text-xs text-[#696C70]">IMG</span>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-[#1F1F1F]">{product.name}</p>
                        <p className="text-xs text-[#696C70]">{product.sku}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'price',
            label: 'Price',
            render: (product: Product) => (
                <span className="font-medium text-[#1F1F1F]">{formatPrice(product.price)}</span>
            ),
        },
        {
            key: 'stock',
            label: 'Stock',
            render: (product: Product) => (
                <span className={cn('font-medium', product.stock === 0 ? 'text-[#DB4444]' : 'text-[#1F1F1F]')}>
                    {product.stock === 0 ? 'Out of stock' : product.stock}
                </span>
            ),
        },
        {
            key: 'category',
            label: 'Category',
        },
        {
            key: 'status',
            label: 'Status',
            render: (product: Product) => (
                <Badge className={cn('rounded-lg capitalize', statusColors[product.status])}>
                    {product.status}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (product: Product) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onClick={() => router.push(`/products/${product.id}`)}
                        >
                            <Eye size={16} className="mr-2" />
                            View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg"
                            onClick={() => router.push(`/products/${product.id}/edit`)}
                        >
                            <Pencil size={16} className="mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-lg text-[#DB4444] focus:text-[#DB4444]"
                            onClick={() => setDeleteDialog({ open: true, product })}
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
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Products</h1>
                <p className="text-[#696C70]">Manage your product catalog</p>
            </div>

            <DataTable
                data={products}
                columns={columns}
                title="All Products"
                searchPlaceholder="Search products..."
                onAdd={() => router.push('/products/new')}
                addButtonLabel="Add Product"
                isLoading={isLoading}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, product: null })}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteDialog.product?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => setDeleteDialog({ open: false, product: null })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl bg-[#DB4444] text-white hover:bg-[#c13d3d]"
                            onClick={() => deleteDialog.product && deleteMutation.mutate(deleteDialog.product.id)}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
