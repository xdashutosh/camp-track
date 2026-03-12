import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, Phone, Loader2, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const { sendOtp, verifyOtp, resetOtp, loading, isOtpSent } = useAuth();
    const navigate = useNavigate();

    // Resend Timer
    const [secondsRemaining, setSecondsRemaining] = useState(120);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let timer: any;
        if (isOtpSent && secondsRemaining > 0) {
            timer = setInterval(() => {
                setSecondsRemaining(prev => prev - 1);
            }, 1000);
        } else if (secondsRemaining === 0) {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [isOtpSent, secondsRemaining]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{10}$/.test(phone)) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        setError('');
        try {
            await sendOtp(phone);
            setSecondsRemaining(120);
            setCanResend(false);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to send OTP');
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await verifyOtp(phone, otp);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Verification failed');
            setOtp('');
        }
    };

    const handleResend = () => {
        if (canResend) {
            handleSendOtp({ preventDefault: () => { } } as React.FormEvent);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col items-center mb-8">
                    <img src="/app_icon.png" alt="Campaign Tracker" className="w-20 h-20 rounded-2xl mb-4 shadow-lg" />
                    <h1 className="text-3xl font-bold text-slate-900">Campaign Admin</h1>
                    <p className="text-slate-400 mt-2">
                        {isOtpSent ? `Enter code sent to ${phone}` : 'Sign in to your account'}
                    </p>
                </div>

                <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-medium text-slate-600">Phone Number</label>
                            {isOtpSent && (
                                <button
                                    type="button"
                                    onClick={resetOtp}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    Change
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                required
                                disabled={isOtpSent}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all ${isOtpSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder="10 digit number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    {isOtpSent && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-sm font-medium text-slate-600">Enter OTP</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all font-mono tracking-widest text-lg"
                                    placeholder="••••••"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                />
                            </div>
                            <div className="flex justify-center pt-2">
                                {canResend ? (
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                    >
                                        Resend OTP
                                    </button>
                                ) : (
                                    <p className="text-xs text-slate-400">
                                        Resend code in <span className="font-mono text-slate-600">{formatTime(secondsRemaining)}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                {isOtpSent ? 'Verify & Sign In' : 'Send One-Time Passcode'}
                                {!isOtpSent && <ArrowRight className="w-4 h-4" />}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
