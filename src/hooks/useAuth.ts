import { useState } from 'react';
import api from '../lib/api';

export interface User {
    id: string;
    name: string;
    phone: string;
    role: string;
    imageUrl?: string;
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('admin_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);

    const sendOtp = async (phone: string) => {
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { phone });
            setIsOtpSent(true);
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (phone: string, otp: string) => {
        setLoading(true);
        try {
            const response = await api.post('/auth/verify-otp', { phone, otp });
            const { token, user: userData } = response.data;

            if (userData.role !== 'admin') {
                throw new Error('Access denied. Admin only.');
            }

            localStorage.setItem('admin_token', token);
            localStorage.setItem('admin_user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } finally {
            setLoading(false);
        }
    };

    const resetOtp = () => {
        setIsOtpSent(false);
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setUser(null);
        setIsOtpSent(false);
        window.location.href = '/login';
    };

    return { user, sendOtp, verifyOtp, resetOtp, logout, loading, isOtpSent, isAuthenticated: !!user };
};
