'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Package, Tag, Storefront, CurrencyDollar } from '@phosphor-icons/react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useFormatPrice } from '@/stores/settings-store';

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    originPrice?: number;
    sku: string;
    stock: number;
    category?: { id: string; name: string };
    brand?: { id: string; name: string };
    images: string[];
    isActive: boolean;
    isFeatured: boolean;
    isOnSale: boolean;
    createdAt: string;
    updatedAt: string;
}

const statusColors = {
    active: 'bg-[#3DAB25] text-white',
    draft: 'bg-[#ECB018] text-white',
    archived: 'bg-[#696C70] text-white',
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const formatPrice = useFormatPrice();
    const productId = params.id as string;

    const { data: product, isLoading, error } = useQuery({
        queryKey: ['product', productId],
        queryFn: async () => {
            const response = await api.get(`/admin/products/${productId}`);
            return response.data as Product;
        },
        enabled: !!productId,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F1F1F]" />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-[#696C70]">Product not found</p>
                <Button onClick={() => router.back()} variant="outline" className="rounded-xl">
                    <ArrowLeft size={18} className="mr-2" />
                    Go Back
                </Button>
            </div>
        );
    }

    const status = product.isActive ? 'active' : 'draft';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => router.push('/products')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-[#1F1F1F]">{product.name}</h1>
                        <p className="text-[#696C70]">SKU: {product.sku}</p>
                    </div>
                </div>
                <Button
                    className="rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F]"
                    onClick={() => router.push(`/products/${productId}/edit`)}
                >
                    <Pencil size={18} className="mr-2" />
                    Edit Product
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Product Image */}
                <Card className="rounded-2xl border-0 shadow-sm lg:col-span-1">
                    <CardContent className="p-6">
                        <div className="aspect-square rounded-xl bg-[#F7F7F7] flex items-center justify-center overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                                <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Package size={64} className="text-[#696C70]" />
                            )}
                        </div>
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto">
                                {product.images.slice(1, 5).map((img, idx) => (
                                    <div key={idx} className="h-16 w-16 rounded-lg bg-[#F7F7F7] flex-shrink-0 overflow-hidden">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Product Details */}
                <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2">
                            <Badge className={cn('rounded-lg', statusColors[status])}>
                                {status}
                            </Badge>
                            {product.isFeatured && (
                                <Badge className="rounded-lg bg-[#8684D4] text-white">Featured</Badge>
                            )}
                            {product.isOnSale && (
                                <Badge className="rounded-lg bg-[#F4407D] text-white">On Sale</Badge>
                            )}
                        </div>

                        {/* Price Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-[#F7F7F7]">
                                <div className="flex items-center gap-2 text-[#696C70] mb-1">
                                    <CurrencyDollar size={16} />
                                    <span className="text-sm">Price</span>
                                </div>
                                <p className="text-2xl font-bold text-[#1F1F1F]">{formatPrice(product.price)}</p>
                            </div>
                            {product.originPrice && (
                                <div className="p-4 rounded-xl bg-[#F7F7F7]">
                                    <div className="flex items-center gap-2 text-[#696C70] mb-1">
                                        <Tag size={16} />
                                        <span className="text-sm">Original Price</span>
                                    </div>
                                    <p className="text-2xl font-bold text-[#696C70] line-through">
                                        {formatPrice(product.originPrice)}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Stock & Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-[#F7F7F7]">
                                <div className="flex items-center gap-2 text-[#696C70] mb-1">
                                    <Package size={16} />
                                    <span className="text-sm">Stock</span>
                                </div>
                                <p className={cn('text-2xl font-bold', product.stock === 0 ? 'text-[#DB4444]' : 'text-[#1F1F1F]')}>
                                    {product.stock === 0 ? 'Out of Stock' : product.stock}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-[#F7F7F7]">
                                <div className="flex items-center gap-2 text-[#696C70] mb-1">
                                    <Storefront size={16} />
                                    <span className="text-sm">Category</span>
                                </div>
                                <p className="text-xl font-bold text-[#1F1F1F]">
                                    {product.category?.name || 'Uncategorized'}
                                </p>
                            </div>
                        </div>

                        {/* Brand */}
                        {product.brand && (
                            <div className="p-4 rounded-xl bg-[#F7F7F7]">
                                <p className="text-sm text-[#696C70] mb-1">Brand</p>
                                <p className="font-semibold text-[#1F1F1F]">{product.brand.name}</p>
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <div>
                                <p className="text-sm text-[#696C70] mb-2">Description</p>
                                <p className="text-[#1F1F1F] leading-relaxed">{product.description}</p>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="text-sm text-[#696C70] pt-4 border-t">
                            <p>Created: {new Date(product.createdAt).toLocaleDateString()}</p>
                            <p>Last Updated: {new Date(product.updatedAt).toLocaleDateString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
