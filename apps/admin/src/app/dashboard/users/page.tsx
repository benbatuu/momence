'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguageStore } from '@/lib/language.store';
import { usersApi, UserDetailItem } from '@/lib/users.api';
import { UserModal } from '@/components/users/user.modal';
import { UserStats } from '@/components/users/user.stats';
import { UserDetailDrawer } from '@/components/users/user.detail.drawer';
import { UserEditModal } from '@/components/users/user.edit.modal';
import {
    Users,
    UserPlus,
    Loader2,
    CheckCircle2,
    XCircle,
    Search,
    Mail,
    Phone,
    AlertCircle,
    Trash2,
    Eye,
    Edit2,
    MoreVertical,
} from 'lucide-react';
import { AxiosError } from 'axios';

export default function UsersPage() {
    const t = useLanguageStore((state) => state.t());
    const [users, setUsers] = useState<UserDetailItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Filtreler
    const [search, setSearch] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    // Modallar ve Drawer
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [selectedUserIdForDrawer, setSelectedUserIdForDrawer] = useState<string | null>(null);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserDetailItem | null>(null);

    // Aksiyon Popover State'i
    const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await usersApi.getUsers({
                search: search || undefined,
                role: roleFilter !== 'ALL' ? roleFilter : undefined,
            });
            setUsers(data);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.message || 'Kullanıcılar yüklenirken hata oluştu.');
            } else {
                setError('Beklenmeyen bir hata oluştu.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [search, roleFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [loadUsers]);

    // Frontend Fallback Filtreleme
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                search.trim() === '' ||
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                (u.phone && u.phone.includes(search));

            const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, search, roleFilter]);

    // Durum Değiştirme
    const handleToggleStatus = async (user: UserDetailItem) => {
        setActiveMenuUserId(null);
        try {
            await usersApi.toggleUserStatus(user.id, !user.isActive);
            loadUsers();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Durum değiştirilemedi.');
            }
        }
    };

    // Silme Aksiyonu
    const handleDelete = async (id: string, name: string) => {
        setActiveMenuUserId(null);
        if (!window.confirm(`"${name}" kullanıcısını silmek istediğinize emin misiniz?`)) return;

        try {
            await usersApi.deleteUser(id);
            loadUsers();
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                alert(err.response?.data?.message || 'Kullanıcı silinemedi.');
            }
        }
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        {t.users.title}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">{t.users.subtitle}</p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-xs cursor-pointer"
                >
                    <UserPlus className="w-4 h-4" />
                    {t.users.createButton}
                </button>
            </div>

            {/* İstatistik Bandı */}
            <UserStats users={filteredUsers} />

            {/* Search & Filter Bar */}
            <div className="bg-card p-3 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t.users.searchPlaceholder}
                        className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                {/* Rol Tab Sekmeleri */}
                <div className="flex bg-input p-1 rounded-xl border border-border w-full sm:w-auto overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setRoleFilter('ALL')}
                        className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${roleFilter === 'ALL'
                            ? 'bg-card text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t.users.filterAll}
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoleFilter('CLIENT')}
                        className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${roleFilter === 'CLIENT'
                            ? 'bg-card text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t.users.filterClients}
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoleFilter('INSTRUCTOR')}
                        className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${roleFilter === 'INSTRUCTOR'
                            ? 'bg-card text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t.users.filterInstructors}
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoleFilter('ADMIN')}
                        className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${roleFilter === 'ADMIN'
                            ? 'bg-card text-foreground shadow-xs font-semibold'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {t.users.filterAdmins}
                    </button>
                </div>
            </div>

            {/* Hata Bildirimi */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-xs text-destructive flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Kullanıcılar Tablosu */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-12 flex justify-center items-center text-muted-foreground text-xs gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Kullanıcılar yükleniyor...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-xs">{t.users.noUsers}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-foreground">
                            <thead className="bg-input text-muted-foreground font-semibold uppercase border-b border-border">
                                <tr>
                                    <th className="p-3.5">{t.users.colName}</th>
                                    <th className="p-3.5">{t.users.colRole}</th>
                                    <th className="p-3.5">{t.users.colPhone}</th>
                                    <th className="p-3.5">{t.users.colStatus}</th>
                                    <th className="p-3.5 text-right">Aksiyonlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                                        <td className="p-3.5 cursor-pointer" onClick={() => setSelectedUserIdForDrawer(u.id)}>
                                            <div className="font-bold text-foreground hover:text-primary transition-colors">
                                                {u.name}
                                            </div>
                                            <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Mail className="w-3 h-3 text-primary shrink-0" /> {u.email}
                                            </div>
                                        </td>
                                        <td className="p-3.5">
                                            <span
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${u.role === 'ADMIN'
                                                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                                    : u.role === 'INSTRUCTOR'
                                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                        : 'bg-primary/10 text-primary border-primary/20'
                                                    }`}
                                            >
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-muted-foreground">
                                            {u.phone ? (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3 text-primary shrink-0" /> {u.phone}
                                                </span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="p-3.5">
                                            {u.isActive ? (
                                                <span className="text-emerald-500 inline-flex items-center gap-1 font-semibold">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> {t.users.statusActive}
                                                </span>
                                            ) : (
                                                <span className="text-destructive inline-flex items-center gap-1 font-semibold">
                                                    <XCircle className="w-3.5 h-3.5" /> {t.users.statusPassive}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3.5 text-right relative">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* Hızlı Detay Göster Butonu */}
                                                <button
                                                    onClick={() => setSelectedUserIdForDrawer(u.id)}
                                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                    title="Detayları İncele"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Hızlı Düzenle Butonu */}
                                                <button
                                                    onClick={() => setSelectedUserForEdit(u)}
                                                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                    title="Düzenle"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Açılır Aksiyon Menüsü */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() =>
                                                            setActiveMenuUserId(activeMenuUserId === u.id ? null : u.id)
                                                        }
                                                        className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                    >
                                                        <MoreVertical className="w-3.5 h-3.5" />
                                                    </button>

                                                    {activeMenuUserId === u.id && (
                                                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-xl shadow-xl z-30 p-1 space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-100">
                                                            <button
                                                                onClick={() => handleToggleStatus(u)}
                                                                className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-accent text-foreground transition-colors flex items-center gap-2 cursor-pointer"
                                                            >
                                                                {u.isActive ? (
                                                                    <>
                                                                        <XCircle className="w-3.5 h-3.5 text-destructive" /> Pasife Al
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Aktif Et
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(u.id, u.name)}
                                                                className="w-full text-left px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-destructive/10 text-destructive transition-colors flex items-center gap-2 cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" /> Kullanıcıyı Sil
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Yeni Kullanıcı Oluşturma Modalı */}
            <UserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={loadUsers}
            />

            {/* Kullanıcı Düzenleme Modalı */}
            <UserEditModal
                user={selectedUserForEdit}
                isOpen={!!selectedUserForEdit}
                onClose={() => setSelectedUserForEdit(null)}
                onSuccess={loadUsers}
            />

            {/* Detay Side Drawer */}
            <UserDetailDrawer
                userId={selectedUserIdForDrawer}
                onClose={() => setSelectedUserIdForDrawer(null)}
                onRefresh={loadUsers}
            />
        </div>
    );
}