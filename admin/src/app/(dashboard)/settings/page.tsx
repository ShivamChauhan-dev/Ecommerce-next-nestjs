'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore, currencies, timezones, type Currency, type Timezone } from '@/stores/settings-store';
import { User, Bell, Shield, Storefront, Image, Check, Spinner } from '@phosphor-icons/react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const {
        storeName,
        logo,
        currency,
        timezone,
        setStoreName,
        setLogo,
        setCurrency,
        setTimezone,
        formatPrice
    } = useSettingsStore();

    const [localStoreName, setLocalStoreName] = useState(storeName);
    const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);
    const [selectedTimezone, setSelectedTimezone] = useState<Timezone>(timezone);
    const [previewLogo, setPreviewLogo] = useState<string | null>(logo);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load settings from backend on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await api.get('/settings');
                const data = response.data;
                if (data) {
                    setLocalStoreName(data.storeName || 'Anvogue');
                    setPreviewLogo(data.logo || null);

                    // Find matching currency
                    const foundCurrency = currencies.find(c => c.code === data.currencyCode);
                    if (foundCurrency) {
                        setSelectedCurrency(foundCurrency);
                        setCurrency(foundCurrency);
                    }

                    // Find matching timezone
                    const foundTimezone = timezones.find(t => t.value === data.timezoneValue);
                    if (foundTimezone) {
                        setSelectedTimezone(foundTimezone);
                        setTimezone(foundTimezone);
                    }

                    // Sync to local store
                    setStoreName(data.storeName || 'Anvogue');
                    setLogo(data.logo || null);
                }
            } catch (error) {
                // Use local storage values if backend fails
                console.log('Using local settings');
            }
        };
        loadSettings();
    }, []);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Logo must be less than 2MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setPreviewLogo(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            // Save to backend
            await api.put('/settings', {
                storeName: localStoreName,
                logo: previewLogo,
                currencyCode: selectedCurrency.code,
                currencySymbol: selectedCurrency.symbol,
                currencyName: selectedCurrency.name,
                currencyLocale: selectedCurrency.locale,
                timezoneValue: selectedTimezone.value,
                timezoneLabel: selectedTimezone.label,
                timezoneOffset: selectedTimezone.offset,
            });

            // Also save to local store for instant reactivity
            setStoreName(localStoreName);
            setLogo(previewLogo);
            setCurrency(selectedCurrency);
            setTimezone(selectedTimezone);

            toast.success('Settings saved to database!');
        } catch (error) {
            // Still save locally even if backend fails
            setStoreName(localStoreName);
            setLogo(previewLogo);
            setCurrency(selectedCurrency);
            setTimezone(selectedTimezone);
            toast.warning('Saved locally (backend error)');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[#1F1F1F]">Settings</h1>
                <p className="text-[#696C70]">Manage your account and store preferences</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Profile Settings */}
                <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-[#D2EF9A] rounded-xl">
                            <User size={20} weight="bold" className="text-[#1F1F1F]" />
                        </div>
                        <CardTitle className="text-lg font-semibold">Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input defaultValue={user?.firstName || ''} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input defaultValue={user?.lastName || ''} className="rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input defaultValue={user?.email || ''} className="rounded-xl" disabled />
                        </div>
                        <Button className="rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F]">
                            Update Profile
                        </Button>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-[#8684D4] rounded-xl">
                            <Shield size={20} weight="bold" className="text-white" />
                        </div>
                        <CardTitle className="text-lg font-semibold">Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input type="password" className="rounded-xl" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" className="rounded-xl" placeholder="••••••••" />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm New Password</Label>
                            <Input type="password" className="rounded-xl" placeholder="••••••••" />
                        </div>
                        <Button className="rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F]">
                            Change Password
                        </Button>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-[#ECB018] rounded-xl">
                            <Bell size={20} weight="bold" className="text-white" />
                        </div>
                        <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-[#1F1F1F]">Order Updates</p>
                                <p className="text-sm text-[#696C70]">Receive notifications for new orders</p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#1F1F1F]" />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-[#1F1F1F]">Low Stock Alerts</p>
                                <p className="text-sm text-[#696C70]">Get notified when products are low in stock</p>
                            </div>
                            <input type="checkbox" defaultChecked className="h-5 w-5 accent-[#1F1F1F]" />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-[#1F1F1F]">New Reviews</p>
                                <p className="text-sm text-[#696C70]">Notifications for pending reviews</p>
                            </div>
                            <input type="checkbox" className="h-5 w-5 accent-[#1F1F1F]" />
                        </div>
                    </CardContent>
                </Card>

                {/* Store Settings */}
                <Card className="rounded-2xl border-0 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-3">
                        <div className="p-2 bg-[#F4407D] rounded-xl">
                            <Storefront size={20} weight="bold" className="text-white" />
                        </div>
                        <CardTitle className="text-lg font-semibold">Store Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Store Logo */}
                        <div className="space-y-3">
                            <Label>Store Logo</Label>
                            <div className="flex items-center gap-4">
                                <div
                                    className="relative h-20 w-20 rounded-xl bg-[#F7F7F7] flex items-center justify-center overflow-hidden border-2 border-dashed border-[#E0E0E0] cursor-pointer hover:border-[#1F1F1F] transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewLogo ? (
                                        <img src={previewLogo} alt="Store logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Image size={32} className="text-[#696C70]" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Upload Logo
                                    </Button>
                                    <p className="text-xs text-[#696C70] mt-1">PNG, JPG up to 2MB</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                />
                            </div>
                        </div>

                        {/* Store Name */}
                        <div className="space-y-2">
                            <Label>Store Name</Label>
                            <Input
                                value={localStoreName}
                                onChange={(e) => setLocalStoreName(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>

                        {/* Currency Dropdown */}
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select
                                value={selectedCurrency.code}
                                onValueChange={(code) => {
                                    const cur = currencies.find(c => c.code === code);
                                    if (cur) setSelectedCurrency(cur);
                                }}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue>
                                        {selectedCurrency.symbol} {selectedCurrency.code} - {selectedCurrency.name}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {currencies.map((cur) => (
                                        <SelectItem key={cur.code} value={cur.code} className="rounded-lg">
                                            <span className="font-medium">{cur.symbol}</span>
                                            <span className="ml-2">{cur.code} - {cur.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-[#696C70]">
                                Preview: {formatPrice(1299.99)}
                            </p>
                        </div>

                        {/* Timezone Dropdown */}
                        <div className="space-y-2">
                            <Label>Timezone</Label>
                            <Select
                                value={selectedTimezone.value}
                                onValueChange={(value) => {
                                    const tz = timezones.find(t => t.value === value);
                                    if (tz) setSelectedTimezone(tz);
                                }}
                            >
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue>
                                        {selectedTimezone.label} ({selectedTimezone.offset})
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {timezones.map((tz) => (
                                        <SelectItem key={tz.value} value={tz.value} className="rounded-lg">
                                            <span>{tz.label}</span>
                                            <span className="ml-2 text-[#696C70]">({tz.offset})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            className="rounded-xl bg-[#1F1F1F] hover:bg-[#D2EF9A] hover:text-[#1F1F1F] w-full"
                            onClick={handleSaveSettings}
                        >
                            <Check size={18} className="mr-2" />
                            Save Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
