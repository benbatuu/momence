'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/auth.store';
import { useLanguageStore } from '@/lib/language.store';
import { api } from '@/lib/api';
import { Settings, User, Lock, Save, Loader2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const t = useLanguageStore((state) => state.t());

    const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY'>('PROFILE');
    const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
    const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
    const [profileSuccess, setProfileSuccess] = useState<boolean>(false);
    const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

    // Initial state'i doğrudan user prop'undan türetiyoruz (useEffect bypass edilir)
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    // Şifre Form State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileSuccess(false);

        try {
            const res = await api.put('/users/profile', profileData);
            const updatedUser = res.data?.data?.user || res.data?.user || res.data?.data;
            if (updatedUser) {
                setUser(updatedUser);
            }
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 4000);
        } catch (err) {
            console.error('Profil güncellenirken hata oluştu:', err);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Yeni şifreler eşleşmiyor!');
            return;
        }

        setIsSavingPassword(true);
        setPasswordSuccess(false);

        try {
            await api.put('/users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setPasswordSuccess(true);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordSuccess(false), 4000);
        } catch (err) {
            console.error('Şifre değiştirilirken hata oluştu:', err);
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Settings className="w-6 h-6 text-primary" />
                    {t.settings.title}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">{t.settings.subtitle}</p>
            </div>

            {/* Tab Navigasyonu */}
            <div className="flex bg-input p-1 rounded-xl border border-border w-full sm:w-fit">
                <button
                    type="button"
                    onClick={() => setActiveTab('PROFILE')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'PROFILE'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>{t.settings.profileTab}</span>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('SECURITY')}
                    className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'SECURITY'
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>{t.settings.securityTab}</span>
                </button>
            </div>

            {/* PROFIL TABI */}
            {activeTab === 'PROFILE' && (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {profileSuccess && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{t.settings.profileUpdated}</span>
                        </div>
                    )}

                    <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.settings.fullName}</label>
                            <input
                                type="text"
                                required
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">{t.settings.email}</label>
                                <input
                                    type="email"
                                    required
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">{t.settings.phone}</label>
                                <input
                                    type="tel"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    placeholder="0532 000 00 00"
                                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                            {isSavingProfile ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{isSavingProfile ? t.settings.saving : t.settings.saveProfile}</span>
                        </button>
                    </div>
                </form>
            )}

            {/* ŞİFRE & GÜVENLİK TABI */}
            {activeTab === 'SECURITY' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    {passwordSuccess && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{t.settings.passwordUpdated}</span>
                        </div>
                    )}

                    <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">{t.settings.currentPassword}</label>
                            <input
                                type="password"
                                required
                                value={passwordData.currentPassword}
                                onChange={(e) =>
                                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                                }
                                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">{t.settings.newPassword}</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.newPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                                    }
                                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-foreground">{t.settings.confirmPassword}</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordData.confirmPassword}
                                    onChange={(e) =>
                                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                                    }
                                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSavingPassword}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                        >
                            {isSavingPassword ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>{isSavingPassword ? t.settings.saving : t.settings.updatePassword}</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}