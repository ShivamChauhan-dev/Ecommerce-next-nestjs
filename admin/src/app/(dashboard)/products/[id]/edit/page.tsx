'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { ArrowLeft, SpinnerGap, Upload, Trash, Plus, Palette } from '@phosphor-icons/react';
import api from '@/lib/api';
import Link from 'next/link';

interface ProductVariation {
    id?: string;
    type: 'color' | 'size' | 'custom';
    name: string;
    value: string;
    image?: string;
    priceAdjustment?: number;
    stockQuantity?: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    comparePrice: number;
    sku: string;
    stock: number;
    category: string;
    brand: string;
    status: string;
    images: string[];
    variations: ProductVariation[];
}

const sampleProduct: Product = {
    id: '1',
    name: 'Classic Cotton T-Shirt',
    description: 'A comfortable and stylish cotton t-shirt perfect for everyday wear. Made from 100% organic cotton.',
    price: 29.99,
    comparePrice: 39.99,
    sku: 'TSH-001',
    stock: 150,
    category: 'fashion',
    brand: 'zara',
    status: 'active',
    images: [],
    variations: [],
};

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const productId = params.id as string;

    const [formData, setFormData] = useState<Product>(sampleProduct);

    // Fetch categories from API
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            try {
                const response = await api.get('/admin/categories');
                return response.data || [];
            } catch {
                return [];
            }
        },
    });

    // Fetch brands from API
    const { data: brands = [] } = useQuery({
        queryKey: ['brands'],
        queryFn: async () => {
            try {
                const response = await api.get('/admin/brands');
                return response.data || [];
            } catch {
                return [];
            }
        },
    });

    const { data: product, isLoading } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            try {
                const response = await api.get(`/admin/products/${productId}`);
                return response.data;
            } catch {
                return sampleProduct;
            }
        },
    });

    useEffect(() => {
        if (product) {
            // Map backend fields to form fields
            setFormData({
                id: product.id,
                name: product.name || '',
                description: product.description || '',
                price: product.price || 0,
                comparePrice: product.originPrice || 0,
                sku: product.sku || '',
                stock: product.stock || 0,
                category: product.categoryId || '',
                brand: product.brandId || '',
                status: product.isActive ? 'active' : 'draft',
                images: product.images || [],
                variations: product.variations?.map((v: any) => ({
                    ...v,
                    type: v.type || 'color',
                    name: v.name || v.color || '',
                    value: v.value || v.colorCode || '',
                })) || [],
            });
        }
    }, [product]);

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<Product>) => {
            // Send only valid fields to backend
            const updateData = {
                name: data.name,
                description: data.description,
                price: data.price,
                originPrice: data.comparePrice,
                sku: data.sku,
                stock: data.stock,
                categoryId: data.category,
                brandId: data.brand,
                isActive: data.status === 'active',
                // Include variations data for product variants
                variations: data.variations?.map(v => ({
                    type: v.type,
                    name: v.name,
                    value: v.value,
                    image: v.image || undefined,
                    priceAdjustment: v.priceAdjustment || 0,
                    stockQuantity: v.stockQuantity || 0,
                })),
            };
            const response = await api.put(`/admin/products/${productId}`, updateData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', productId] });
            router.push('/products');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/admin/products/${productId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            router.push('/products');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1F1F1F] border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/products">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Edit Product</h1>
                        <p className="text-[#696C70]">{formData.name}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="rounded-xl text-[#DB4444] border-[#DB4444] hover:bg-[#DB4444] hover:text-white"
                    onClick={() => deleteMutation.mutate()}
                >
                    <Trash size={18} className="mr-2" />
                    Delete Product
                </Button>
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

                    {/* Product Variants */}
                    <Card className="rounded-2xl border-0 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Palette size={20} />
                                Product Variants
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            variations: [
                                                ...formData.variations,
                                                { type: 'color', name: '', value: '#000000', image: '', priceAdjustment: 0, stockQuantity: 0 }
                                            ]
                                        });
                                    }}
                                >
                                    <Plus size={16} className="mr-1" />
                                    Color
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            variations: [
                                                ...formData.variations,
                                                { type: 'size', name: '', value: '', image: '', priceAdjustment: 0, stockQuantity: 0 }
                                            ]
                                        });
                                    }}
                                >
                                    <Plus size={16} className="mr-1" />
                                    Size
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="rounded-xl"
                                    onClick={() => {
                                        setFormData({
                                            ...formData,
                                            variations: [
                                                ...formData.variations,
                                                { type: 'custom', name: '', value: '', image: '', priceAdjustment: 0, stockQuantity: 0 }
                                            ]
                                        });
                                    }}
                                >
                                    <Plus size={16} className="mr-1" />
                                    Custom
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formData.variations.length === 0 ? (
                                <div className="text-center py-8 text-[#696C70]">
                                    <Palette size={40} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No product variants added yet</p>
                                    <p className="text-xs">Add Color, Size, or Custom variants</p>
                                </div>
                            ) : (
                                formData.variations.map((variant, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl space-y-3 ${variant.type === 'color' ? 'bg-blue-50' :
                                            variant.type === 'size' ? 'bg-green-50' : 'bg-purple-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${variant.type === 'color' ? 'bg-blue-100 text-blue-700' :
                                                variant.type === 'size' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {variant.type.toUpperCase()}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-[#DB4444] hover:text-[#DB4444] hover:bg-red-50"
                                                onClick={() => {
                                                    const newVariations = formData.variations.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, variations: newVariations });
                                                }}
                                            >
                                                <Trash size={16} />
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">
                                                    {variant.type === 'color' ? 'Color Name' :
                                                        variant.type === 'size' ? 'Size Name' : 'Option Name'}
                                                </Label>
                                                <Input
                                                    value={variant.name}
                                                    onChange={(e) => {
                                                        const newVariations = [...formData.variations];
                                                        newVariations[index].name = e.target.value;
                                                        setFormData({ ...formData, variations: newVariations });
                                                    }}
                                                    className="rounded-xl h-9"
                                                    placeholder={
                                                        variant.type === 'color' ? 'e.g. Navy Blue' :
                                                            variant.type === 'size' ? 'e.g. XL' : 'e.g. Material'
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">
                                                    {variant.type === 'color' ? 'Color Code' : 'Value'}
                                                </Label>
                                                {variant.type === 'color' ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={variant.value || '#000000'}
                                                            onChange={(e) => {
                                                                const newVariations = [...formData.variations];
                                                                newVariations[index].value = e.target.value;
                                                                setFormData({ ...formData, variations: newVariations });
                                                            }}
                                                            className="w-9 h-9 rounded-lg border border-[#E9E9E9] cursor-pointer"
                                                        />
                                                        <Input
                                                            value={variant.value}
                                                            onChange={(e) => {
                                                                const newVariations = [...formData.variations];
                                                                newVariations[index].value = e.target.value;
                                                                setFormData({ ...formData, variations: newVariations });
                                                            }}
                                                            className="rounded-xl h-9 flex-1"
                                                            placeholder="#000000"
                                                        />
                                                    </div>
                                                ) : (
                                                    <Input
                                                        value={variant.value}
                                                        onChange={(e) => {
                                                            const newVariations = [...formData.variations];
                                                            newVariations[index].value = e.target.value;
                                                            setFormData({ ...formData, variations: newVariations });
                                                        }}
                                                        className="rounded-xl h-9"
                                                        placeholder={variant.type === 'size' ? 'XL, XXL, etc.' : 'Cotton, Leather, etc.'}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Price Adjustment ($)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={variant.priceAdjustment || 0}
                                                    onChange={(e) => {
                                                        const newVariations = [...formData.variations];
                                                        newVariations[index].priceAdjustment = Number(e.target.value);
                                                        setFormData({ ...formData, variations: newVariations });
                                                    }}
                                                    className="rounded-xl h-9"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Stock Qty</Label>
                                                <Input
                                                    type="number"
                                                    value={variant.stockQuantity || 0}
                                                    onChange={(e) => {
                                                        const newVariations = [...formData.variations];
                                                        newVariations[index].stockQuantity = Number(e.target.value);
                                                        setFormData({ ...formData, variations: newVariations });
                                                    }}
                                                    className="rounded-xl h-9"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Image URL</Label>
                                                <Input
                                                    value={variant.image || ''}
                                                    onChange={(e) => {
                                                        const newVariations = [...formData.variations];
                                                        newVariations[index].image = e.target.value;
                                                        setFormData({ ...formData, variations: newVariations });
                                                    }}
                                                    className="rounded-xl h-9"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
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
                                        {categories.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                        {categories.length === 0 && (
                                            <SelectItem value="" disabled>No categories found</SelectItem>
                                        )}
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
                                        {brands.map((brand: any) => (
                                            <SelectItem key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                        {brands.length === 0 && (
                                            <SelectItem value="" disabled>No brands found</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className="w-full rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F] h-12"
                        >
                            {updateMutation.isPending ? (
                                <SpinnerGap size={20} className="animate-spin" />
                            ) : (
                                'Save Changes'
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
