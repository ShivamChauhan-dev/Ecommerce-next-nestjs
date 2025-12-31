'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface ShippingZone {
    id: string;
    name: string;
    countries: string[];
    flatRate: number;
    freeShippingMin: number;
}

const sampleZones: ShippingZone[] = [
    { id: '1', name: 'Domestic', countries: ['United States'], flatRate: 5.99, freeShippingMin: 50 },
    { id: '2', name: 'Europe', countries: ['UK', 'Germany', 'France', 'Italy'], flatRate: 15.99, freeShippingMin: 100 },
    { id: '3', name: 'Asia Pacific', countries: ['Japan', 'Australia', 'Singapore'], flatRate: 19.99, freeShippingMin: 150 },
    { id: '4', name: 'Rest of World', countries: ['Other'], flatRate: 25.99, freeShippingMin: 200 },
];

export default function ShippingPage() {
    const queryClient = useQueryClient();
    const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; zone: ShippingZone | null }>({
        open: false,
        mode: 'add',
        zone: null,
    });
    const [formData, setFormData] = useState({
        name: '',
        countries: '',
        flatRate: 0,
        freeShippingMin: 0,
    });

    const { data: zones = sampleZones, isLoading } = useQuery({
        queryKey: ['shipping-zones'],
        queryFn: async () => {
            try {
                const response = await api.get('/shipping/zones');
                return response.data || sampleZones;
            } catch {
                return sampleZones;
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            await api.post('/shipping/zones', { ...data, countries: data.countries.split(',').map(c => c.trim()) });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
            setDialog({ open: false, mode: 'add', zone: null });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/shipping/zones/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shipping-zones'] });
        },
    });

    const openAddDialog = () => {
        setFormData({ name: '', countries: '', flatRate: 0, freeShippingMin: 0 });
        setDialog({ open: true, mode: 'add', zone: null });
    };

    const openEditDialog = (zone: ShippingZone) => {
        setFormData({
            name: zone.name,
            countries: zone.countries.join(', '),
            flatRate: zone.flatRate,
            freeShippingMin: zone.freeShippingMin,
        });
        setDialog({ open: true, mode: 'edit', zone });
    };

    const columns = [
        { key: 'name', label: 'Zone', render: (z: ShippingZone) => <span className="font-medium text-[#1F1F1F]">{z.name}</span> },
        {
            key: 'countries',
            label: 'Countries',
            render: (z: ShippingZone) => (
                <div className="flex flex-wrap gap-1">
                    {z.countries.slice(0, 3).map(c => (
                        <span key={c} className="bg-[#F7F7F7] px-2 py-0.5 rounded text-xs">{c}</span>
                    ))}
                    {z.countries.length > 3 && <span className="text-xs text-[#696C70]">+{z.countries.length - 3} more</span>}
                </div>
            ),
        },
        { key: 'flatRate', label: 'Flat Rate', render: (z: ShippingZone) => `$${z.flatRate.toFixed(2)}` },
        { key: 'freeShippingMin', label: 'Free Shipping Min', render: (z: ShippingZone) => `$${z.freeShippingMin}` },
        {
            key: 'actions',
            label: 'Actions',
            render: (z: ShippingZone) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <DotsThree size={20} weight="bold" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => openEditDialog(z)}>
                            <Pencil size={16} className="mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg text-[#DB4444]" onClick={() => deleteMutation.mutate(z.id)}>
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
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Shipping Zones</h1>
                <p className="text-[#696C70]">Configure shipping rates by region</p>
            </div>

            <DataTable data={zones} columns={columns} title="All Zones" searchPlaceholder="Search zones..." onAdd={openAddDialog} addButtonLabel="Add Zone" isLoading={isLoading} />

            <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{dialog.mode === 'add' ? 'Add Shipping Zone' : 'Edit Shipping Zone'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Zone Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-xl" placeholder="e.g. Domestic" />
                        </div>
                        <div className="space-y-2">
                            <Label>Countries (comma-separated)</Label>
                            <Input value={formData.countries} onChange={(e) => setFormData({ ...formData, countries: e.target.value })} className="rounded-xl" placeholder="US, Canada, Mexico" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Flat Rate ($)</Label>
                                <Input type="number" step="0.01" value={formData.flatRate} onChange={(e) => setFormData({ ...formData, flatRate: Number(e.target.value) })} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Free Shipping Min ($)</Label>
                                <Input type="number" value={formData.freeShippingMin} onChange={(e) => setFormData({ ...formData, freeShippingMin: Number(e.target.value) })} className="rounded-xl" />
                            </div>
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
