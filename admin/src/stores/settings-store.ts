'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Currency {
    code: string;
    symbol: string;
    name: string;
    locale: string;
}

export const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', locale: 'ar-SA' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', locale: 'zh-CN' },
];

export interface Timezone {
    value: string;
    label: string;
    offset: string;
}

export const timezones: Timezone[] = [
    { value: 'Asia/Kolkata', label: 'India Standard Time', offset: 'UTC+5:30' },
    { value: 'America/New_York', label: 'Eastern Time (US)', offset: 'UTC-5' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (US)', offset: 'UTC-8' },
    { value: 'America/Chicago', label: 'Central Time (US)', offset: 'UTC-6' },
    { value: 'Europe/London', label: 'London (GMT)', offset: 'UTC+0' },
    { value: 'Europe/Paris', label: 'Central European Time', offset: 'UTC+1' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time', offset: 'UTC+4' },
    { value: 'Asia/Singapore', label: 'Singapore Time', offset: 'UTC+8' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time', offset: 'UTC+9' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time', offset: 'UTC+11' },
];

interface StoreSettings {
    storeName: string;
    logo: string | null;
    currency: Currency;
    timezone: Timezone;
    setStoreName: (name: string) => void;
    setLogo: (logo: string | null) => void;
    setCurrency: (currency: Currency) => void;
    setTimezone: (timezone: Timezone) => void;
    formatPrice: (price: number) => string;
}

export const useSettingsStore = create<StoreSettings>()(
    persist(
        (set, get) => ({
            storeName: 'Anvogue',
            logo: null,
            currency: currencies[0], // USD default
            timezone: timezones[0], // IST default

            setStoreName: (name) => set({ storeName: name }),
            setLogo: (logo) => set({ logo }),
            setCurrency: (currency) => set({ currency }),
            setTimezone: (timezone) => set({ timezone }),

            formatPrice: (price: number) => {
                const { currency } = get();
                try {
                    return new Intl.NumberFormat(currency.locale, {
                        style: 'currency',
                        currency: currency.code,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(price);
                } catch {
                    return `${currency.symbol}${price.toFixed(2)}`;
                }
            },
        }),
        {
            name: 'anvogue-settings',
        }
    )
);

// Utility hook for formatting prices anywhere in the app
export function useFormatPrice() {
    const formatPrice = useSettingsStore((state) => state.formatPrice);
    return formatPrice;
}
