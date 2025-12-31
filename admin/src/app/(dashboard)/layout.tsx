'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading, setLoading } = useAuthStore();

    useEffect(() => {
        // Check if we're on the client side
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (!token && !isAuthenticated) {
                router.push('/login');
            }
            setLoading(false);
        }
    }, [isAuthenticated, router, setLoading]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F7F7F7]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1F1F1F] border-t-transparent" />
                    <p className="text-[#696C70]">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F7F7F7]">
            <Sidebar />
            <div className="flex-1 pl-[260px] transition-all duration-300">
                <Header />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
