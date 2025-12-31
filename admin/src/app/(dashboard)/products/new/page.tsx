'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, SpinnerGap, Upload } from '@phosphor-icons/react';
import api from '@/lib/api';
import Link from 'next/link';

export default function NewProductPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        comparePrice: 0,
        sku: '',
        stock: 0,
        category: '',
        brand: '',
        status: 'draft',
        images: [] as string[],
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await api.post('/admin/products', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            router.push('/products');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/products">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft size={20} />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-[#1F1F1F]">Add New Product</h1>
                    <p className="text-[#696C70]">Create a new product for your store</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="rounded-xl"
                                    placeholder="Enter product name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="rounded-xl min-h-[120px]"
                                    placeholder="Enter product description"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Pricing</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                    className="rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Compare at Price ($)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.comparePrice}
                                    onChange={(e) => setFormData({ ...formData, comparePrice: Number(e.target.value) })}
                                    className="rounded-xl"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>SKU</Label>
                                <Input
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    className="rounded-xl"
                                    placeholder="e.g. TSH-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Stock Quantity</Label>
                                <Input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                                    className="rounded-xl"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Images</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-[#E9E9E9] rounded-xl p-8 text-center hover:border-[#1F1F1F] transition-colors cursor-pointer">
                                <Upload size={40} className="mx-auto text-[#696C70] mb-3" />
                                <p className="text-[#696C70] text-sm">Drag & drop images here, or click to upload</p>
                                <p className="text-[#A0A0A0] text-xs mt-1">PNG, JPG, WEBP up to 5MB</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Organization */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Organization</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fashion">Fashion</SelectItem>
                                        <SelectItem value="accessories">Accessories</SelectItem>
                                        <SelectItem value="footwear">Footwear</SelectItem>
                                        <SelectItem value="cosmetics">Cosmetics</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Brand</Label>
                                <Select
                                    value={formData.brand}
                                    onValueChange={(value) => setFormData({ ...formData, brand: value })}
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Select brand" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nike">Nike</SelectItem>
                                        <SelectItem value="adidas">Adidas</SelectItem>
                                        <SelectItem value="zara">Zara</SelectItem>
                                        <SelectItem value="gucci">Gucci</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="w-full rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F] h-12"
                        >
                            {createMutation.isPending ? (
                                <SpinnerGap size={20} className="animate-spin" />
                            ) : (
                                'Create Product'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full rounded-xl h-12"
                            onClick={() => router.push('/products')}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
