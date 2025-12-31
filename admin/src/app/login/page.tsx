'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';
import { Eye, EyeSlash, SpinnerGap } from '@phosphor-icons/react';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            // Backend returns access_token, refresh_token (with underscores)
            const { user, access_token, refresh_token } = response.data;

            // Check if user is admin
            if (user.role !== 'ADMIN') {
                setError('Access denied. Admin privileges required.');
                setIsLoading(false);
                return;
            }

            setAuth(user, access_token, refresh_token);
            router.push('/dashboard');
        } catch (err: unknown) {
            // Demo mode: Allow login with demo credentials when backend is unavailable
            if (email === 'admin@anvogue.com' && password === 'admin123') {
                const demoUser = {
                    id: 'demo-admin-1',
                    email: 'admin@anvogue.com',
                    firstName: 'Demo',
                    lastName: 'Admin',
                    role: 'ADMIN',
                };
                setAuth(demoUser, 'demo-token', 'demo-refresh');
                router.push('/dashboard');
                return;
            }
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] p-4">
            <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg">
                <CardHeader className="text-center space-y-2 pb-4">
                    {/* Logo */}
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F1F1F] text-white font-bold text-lg">
                                A
                            </div>
                            <span className="text-2xl font-semibold text-[#1F1F1F]">Anvogue</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-semibold text-[#1F1F1F]">
                        Admin Login
                    </CardTitle>
                    <CardDescription className="text-[#696C70]">
                        Enter your credentials to access the admin panel
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DB4444] text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[#1F1F1F] font-medium">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@anvogue.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 rounded-xl border-[#E9E9E9] focus:border-[#1F1F1F] bg-white"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[#1F1F1F] font-medium">
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-12 rounded-xl border-[#E9E9E9] focus:border-[#1F1F1F] bg-white pr-12"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#696C70] hover:text-[#1F1F1F]"
                                >
                                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-[#E9E9E9] text-[#1F1F1F] focus:ring-[#1F1F1F]"
                                />
                                <span className="text-[#696C70]">Remember me</span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-[#1F1F1F] font-medium hover:underline"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-[#1F1F1F] text-white font-semibold hover:bg-[#D2EF9A] hover:text-[#1F1F1F] transition-all duration-300"
                        >
                            {isLoading ? (
                                <SpinnerGap size={20} className="animate-spin" />
                            ) : (
                                'Login'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
