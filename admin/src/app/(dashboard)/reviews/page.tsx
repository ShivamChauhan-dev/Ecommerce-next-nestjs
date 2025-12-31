'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsThree, Check, X, Star } from '@phosphor-icons/react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Review {
    id: string;
    productName: string;
    customer: string;
    rating: number;
    comment: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const sampleReviews: Review[] = [
    { id: '1', productName: 'Classic Cotton T-Shirt', customer: 'John Doe', rating: 5, comment: 'Great quality and comfortable fit!', status: 'approved', createdAt: '2024-12-30' },
    { id: '2', productName: 'Leather Crossbody Bag', customer: 'Jane Smith', rating: 4, comment: 'Beautiful bag, love the design.', status: 'pending', createdAt: '2024-12-29' },
    { id: '3', productName: 'Slim Fit Jeans', customer: 'Bob Wilson', rating: 3, comment: 'Good fit but could be better quality.', status: 'pending', createdAt: '2024-12-29' },
    { id: '4', productName: 'Running Sneakers', customer: 'Alice Brown', rating: 5, comment: 'Best sneakers I\'ve ever bought!', status: 'approved', createdAt: '2024-12-28' },
    { id: '5', productName: 'Wool Blend Sweater', customer: 'Charlie Davis', rating: 2, comment: 'Not warm enough for winter.', status: 'rejected', createdAt: '2024-12-27' },
];

const statusColors = {
    pending: 'bg-[#ECB018] text-white',
    approved: 'bg-[#3DAB25] text-white',
    rejected: 'bg-[#DB4444] text-white',
};

export default function ReviewsPage() {
    const queryClient = useQueryClient();

    const { data: reviews = sampleReviews, isLoading } = useQuery({
        queryKey: ['reviews'],
        queryFn: async () => {
            try {
                const response = await api.get('/reviews/admin/all');
                return response.data || sampleReviews;
            } catch {
                return sampleReviews;
            }
        },
    });

    const moderateMutation = useMutation({
        mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) => {
            await api.post(`/reviews/admin/${id}/moderate`, { action });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
        },
    });

    const renderStars = (rating: number) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} weight={star <= rating ? 'fill' : 'regular'} className={star <= rating ? 'text-[#ECB018]' : 'text-[#E9E9E9]'} />
            ))}
        </div>
    );

    const columns = [
        {
            key: 'customer',
            label: 'Customer',
            render: (r: Review) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#D2EF9A] text-[#1F1F1F] text-xs font-semibold">
                            {r.customer.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-[#1F1F1F]">{r.customer}</span>
                </div>
            ),
        },
        { key: 'productName', label: 'Product' },
        { key: 'rating', label: 'Rating', render: (r: Review) => renderStars(r.rating) },
        { key: 'comment', label: 'Comment', render: (r: Review) => <span className="text-sm text-[#696C70] line-clamp-2">{r.comment}</span> },
        { key: 'status', label: 'Status', render: (r: Review) => <Badge className={cn('rounded-lg capitalize', statusColors[r.status])}>{r.status}</Badge> },
        {
            key: 'actions',
            label: 'Actions',
            render: (r: Review) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        {r.status === 'pending' && (
                            <>
                                <DropdownMenuItem className="cursor-pointer rounded-lg text-[#3DAB25]" onClick={() => moderateMutation.mutate({ id: r.id, action: 'approve' })}>
                                    <Check size={16} className="mr-2" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer rounded-lg text-[#DB4444]" onClick={() => moderateMutation.mutate({ id: r.id, action: 'reject' })}>
                                    <X size={16} className="mr-2" /> Reject
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Reviews</h1>
                <p className="text-[#696C70]">Moderate customer reviews</p>
            </div>

            <DataTable data={reviews} columns={columns} title="All Reviews" searchPlaceholder="Search reviews..." isLoading={isLoading} />
        </div>
    );
}
