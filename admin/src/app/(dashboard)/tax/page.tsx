'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DotsThree, Pencil, Trash } from '@phosphor-icons/react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface TaxRate {
    id: string;
    name: string;
    region: string;
    rate: number;
    isActive: boolean;
}

const sampleTaxRates: TaxRate[] = [
    { id: '1', name: 'US Sales Tax', region: 'United States', rate: 7.5, isActive: true },
    { id: '2', name: 'EU VAT', region: 'European Union', rate: 20, isActive: true },
    { id: '3', name: 'UK VAT', region: 'United Kingdom', rate: 20, isActive: true },
    { id: '4', name: 'Canada GST', region: 'Canada', rate: 5, isActive: true },
    { id: '5', name: 'Australia GST', region: 'Australia', rate: 10, isActive: false },
];

export default function TaxPage() {
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; tax: TaxRate | null }>({
        open: false,
        mode: 'add',
        tax: null,
    });
    const [formData, setFormData] = useState({
        name: '',
        region: '',
        rate: 0,
        isActive: true,
    });

    const { data: taxRates = sampleTaxRates, isLoading } = useQuery({
        queryKey: ['tax-rates'],
        queryFn: async () => {
            try {
                const response = await api.get('/tax');
                return response.data || sampleTaxRates;
            } catch {
                return sampleTaxRates;
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            await api.post('/tax/admin', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
            setDialog({ open: false, mode: 'add', tax: null });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/tax/admin/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tax-rates'] });
        },
    });

    const openAddDialog = () => {
        setFormData({ name: '', region: '', rate: 0, isActive: true });
        setDialog({ open: true, mode: 'add', tax: null });
    };

    const openEditDialog = (tax: TaxRate) => {
        setFormData({
            name: tax.name,
            region: tax.region,
            rate: tax.rate,
            isActive: tax.isActive,
        });
        setDialog({ open: true, mode: 'edit', tax });
    };

    const columns = [
        { key: 'name', label: 'Name', render: (t: TaxRate) => <span className="font-medium text-[#1F1F1F]">{t.name}</span> },
        { key: 'region', label: 'Region' },
        { key: 'rate', label: 'Rate', render: (t: TaxRate) => <span className="font-semibold text-[#1F1F1F]">{t.rate}%</span> },
        {
            key: 'isActive',
            label: 'Status',
            render: (t: TaxRate) => (
                <Badge className={cn('rounded-lg', t.isActive ? 'bg-[#3DAB25] text-white' : 'bg-[#696C70] text-white')}>
                    {t.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (t: TaxRate) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => openEditDialog(t)}>
                            <Pencil size={16} className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg text-[#DB4444]" onClick={() => deleteMutation.mutate(t.id)}>
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
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Tax Rates</h1>
                <p className="text-[#696C70]">Configure tax rates by region</p>
            </div>

            <DataTable data={taxRates} columns={columns} title="All Tax Rates" searchPlaceholder="Search tax rates..." onAdd={openAddDialog} addButtonLabel="Add Tax Rate" isLoading={isLoading} />

            <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{dialog.mode === 'add' ? 'Add Tax Rate' : 'Edit Tax Rate'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" placeholder="e.g. US Sales Tax" />
                        </div>
                        <div className="space-y-2">
                            <Label>Region</Label>
                            <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="rounded-xl" placeholder="e.g. United States" />
                        </div>
                        <div className="space-y-2">
                            <Label>Rate (%)</Label>
                            <Input type="number" step="0.1" value={formData.rate} onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })} className="rounded-xl" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" className="rounded-xl" onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                        <Button className="rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F]" onClick={() => createMutation.mutate(formData)}>
                            {dialog.mode === 'add' ? 'Create' : 'Update'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
