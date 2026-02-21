"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { LiquidBackground } from "@/components/ui/LiquidBackground";
import {
    Search, Ban, Snowflake, Shield, ChevronLeft, Eye,
    AlertTriangle, CheckCircle, XCircle, Clock, MoreVertical,
    User as UserIcon, Calendar, Mail, MapPin, FileText, X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserData {
    id: string;
    username: string;
    display_name: string | null;
    real_name: string | null;
    territory_id: string | null;
    is_verified: boolean;
    is_banned: boolean;
    ban_reason: string | null;
    banned_at: string | null;
    frozen_until: string | null;
    freeze_reason: string | null;
    admin_notes: string | null;
    verification_status: string;
    created_at: string;
    territories: { name: string } | null;
}

type ModalType = 'ban' | 'freeze' | 'note' | 'view' | null;

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<'all' | 'active' | 'banned' | 'frozen' | 'pending'>('all');
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [reason, setReason] = useState("");
    const [freezeDuration, setFreezeDuration] = useState("24");
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();

    const fetchUsers = useCallback(async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== 'veritas9818@gmail.com') {
            router.push('/feed');
            return;
        }

        const { data, error } = await supabase
            .from('user_profiles')
            .select(`
                id, username, display_name, real_name, territory_id,
                is_verified, is_banned, ban_reason, banned_at,
                frozen_until, freeze_reason, admin_notes,
                verification_status, created_at,
                territories ( name )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching users:", error);
        } else {
            setUsers((data as unknown as UserData[]) || []);
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        let result = users;

        // Apply text search
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(u =>
                u.username?.toLowerCase().includes(q) ||
                u.real_name?.toLowerCase().includes(q) ||
                u.id.includes(q)
            );
        }

        // Apply status filter
        switch (filter) {
            case 'active':
                result = result.filter(u => !u.is_banned && (!u.frozen_until || new Date(u.frozen_until) < new Date()) && u.verification_status === 'approved');
                break;
            case 'banned':
                result = result.filter(u => u.is_banned);
                break;
            case 'frozen':
                result = result.filter(u => u.frozen_until && new Date(u.frozen_until) > new Date() && !u.is_banned);
                break;
            case 'pending':
                result = result.filter(u => u.verification_status === 'pending');
                break;
        }

        setFilteredUsers(result);
    }, [users, search, filter]);

    const handleBan = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        const supabase = createClient();

        const { error } = await supabase
            .from('user_profiles')
            .update({
                is_banned: true,
                ban_reason: reason,
                banned_at: new Date().toISOString()
            })
            .eq('id', selectedUser.id);

        if (!error) {
            // Log action
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('admin_audit_log').insert({
                admin_id: user?.id,
                target_user_id: selectedUser.id,
                action: 'ban',
                reason
            });
            await fetchUsers();
            closeModal();
        } else {
            alert("Failed to ban user: " + error.message);
        }
        setActionLoading(false);
    };

    const handleUnban = async (userId: string) => {
        setActionLoading(true);
        const supabase = createClient();

        const { error } = await supabase
            .from('user_profiles')
            .update({ is_banned: false, ban_reason: null, banned_at: null })
            .eq('id', userId);

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('admin_audit_log').insert({
                admin_id: user?.id,
                target_user_id: userId,
                action: 'unban',
                reason: 'Unbanned by admin'
            });
            await fetchUsers();
        }
        setActionLoading(false);
    };

    const handleFreeze = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        const supabase = createClient();

        const hours = parseInt(freezeDuration);
        // eslint-disable-next-line react-hooks/purity
        const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
            .from('user_profiles')
            .update({
                frozen_until: until,
                freeze_reason: reason
            })
            .eq('id', selectedUser.id);

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('admin_audit_log').insert({
                admin_id: user?.id,
                target_user_id: selectedUser.id,
                action: 'freeze',
                reason,
                metadata: { duration_hours: hours, until }
            });
            await fetchUsers();
            closeModal();
        } else {
            alert("Failed to freeze user: " + error.message);
        }
        setActionLoading(false);
    };

    const handleUnfreeze = async (userId: string) => {
        setActionLoading(true);
        const supabase = createClient();

        const { error } = await supabase
            .from('user_profiles')
            .update({ frozen_until: null, freeze_reason: null })
            .eq('id', userId);

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('admin_audit_log').insert({
                admin_id: user?.id,
                target_user_id: userId,
                action: 'unfreeze',
                reason: 'Unfrozen by admin'
            });
            await fetchUsers();
        }
        setActionLoading(false);
    };

    const handleAddNote = async () => {
        if (!selectedUser) return;
        setActionLoading(true);
        const supabase = createClient();

        const existingNotes = selectedUser.admin_notes || '';
        const timestamp = new Date().toLocaleString();
        const newNotes = existingNotes
            ? `${existingNotes}\n[${timestamp}] ${reason}`
            : `[${timestamp}] ${reason}`;

        const { error } = await supabase
            .from('user_profiles')
            .update({ admin_notes: newNotes })
            .eq('id', selectedUser.id);

        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('admin_audit_log').insert({
                admin_id: user?.id,
                target_user_id: selectedUser.id,
                action: 'note',
                reason
            });
            await fetchUsers();
            closeModal();
        }
        setActionLoading(false);
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedUser(null);
        setReason("");
        setFreezeDuration("24");
    };

    const openModal = (user: UserData, type: ModalType) => {
        setSelectedUser(user);
        setModalType(type);
        setReason("");
    };

    const getStatusBadge = (user: UserData) => {
        if (user.is_banned) return (
            <span className="flex items-center gap-1 text-xs font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                <Ban size={10} /> BANNED
            </span>
        );
        if (user.frozen_until && new Date(user.frozen_until) > new Date()) return (
            <span className="flex items-center gap-1 text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                <Snowflake size={10} /> FROZEN
            </span>
        );
        if (user.verification_status === 'pending') return (
            <span className="flex items-center gap-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30">
                <Clock size={10} /> PENDING
            </span>
        );
        if (user.verification_status === 'rejected') return (
            <span className="flex items-center gap-1 text-xs font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/30">
                <XCircle size={10} /> REJECTED
            </span>
        );
        return (
            <span className="flex items-center gap-1 text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
                <CheckCircle size={10} /> ACTIVE
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white bg-black">
                <div className="text-center">
                    <UserIcon className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
                    <p className="text-zinc-500">Loading souls...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white bg-black">
            <LiquidBackground />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors">
                            <ChevronLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                                User Management
                            </h1>
                            <p className="text-zinc-500 text-sm">{users.length} registered souls</p>
                        </div>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by username, real name, or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {(['all', 'active', 'pending', 'banned', 'frozen'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-800 text-xs text-zinc-500 font-bold uppercase tracking-wider">
                        <div className="col-span-3">User</div>
                        <div className="col-span-2">Territory</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">Joined</div>
                        <div className="col-span-3 text-right">Actions</div>
                    </div>

                    {/* User Rows */}
                    {filteredUsers.length === 0 ? (
                        <div className="p-12 text-center text-zinc-600">
                            <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-bold">No souls found</p>
                            <p className="text-sm mt-1">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 md:px-6 py-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${user.is_banned ? 'bg-red-950/10' : ''
                                    }`}
                            >
                                {/* User Info */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center text-sm font-bold shrink-0">
                                        {user.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white truncate">@{user.username}</p>
                                        <p className="text-xs text-zinc-500 truncate">{user.real_name || 'No name'}</p>
                                    </div>
                                </div>

                                {/* Territory */}
                                <div className="col-span-2 flex items-center">
                                    <span className="text-sm text-zinc-400 truncate flex items-center gap-1">
                                        <MapPin size={12} className="shrink-0" />
                                        {user.territories?.name || 'Unknown'}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="col-span-2 flex items-center">
                                    {getStatusBadge(user)}
                                </div>

                                {/* Joined */}
                                <div className="col-span-2 flex items-center">
                                    <span className="text-sm text-zinc-500 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-3 flex items-center justify-end gap-2 flex-wrap">
                                    <button
                                        onClick={() => openModal(user, 'view')}
                                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                        title="View Details"
                                    >
                                        <Eye size={14} />
                                    </button>

                                    {!user.is_banned ? (
                                        <button
                                            onClick={() => openModal(user, 'ban')}
                                            className="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition-colors"
                                            title="Ban User"
                                        >
                                            <Ban size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUnban(user.id)}
                                            disabled={actionLoading}
                                            className="px-3 py-1.5 rounded-lg bg-green-900/30 hover:bg-green-900/60 text-green-400 text-xs font-bold transition-colors"
                                            title="Unban User"
                                        >
                                            Unban
                                        </button>
                                    )}

                                    {(!user.frozen_until || new Date(user.frozen_until) < new Date()) ? (
                                        <button
                                            onClick={() => openModal(user, 'freeze')}
                                            className="p-2 rounded-lg bg-blue-900/30 hover:bg-blue-900/60 text-blue-400 hover:text-blue-300 transition-colors"
                                            title="Freeze Account"
                                        >
                                            <Snowflake size={14} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUnfreeze(user.id)}
                                            disabled={actionLoading}
                                            className="px-3 py-1.5 rounded-lg bg-cyan-900/30 hover:bg-cyan-900/60 text-cyan-400 text-xs font-bold transition-colors"
                                            title="Unfreeze"
                                        >
                                            Thaw
                                        </button>
                                    )}

                                    <button
                                        onClick={() => openModal(user, 'note')}
                                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-yellow-400 transition-colors"
                                        title="Add Note"
                                    >
                                        <FileText size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* === MODALS === */}
            {modalType && selectedUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                            <h3 className="text-xl font-black text-white">
                                {modalType === 'ban' && '⛔ Ban User'}
                                {modalType === 'freeze' && '❄️ Freeze Account'}
                                {modalType === 'note' && '📝 Add Admin Note'}
                                {modalType === 'view' && '👁️ User Details'}
                            </h3>
                            <button onClick={closeModal} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="p-6">
                            {/* User Info Bar */}
                            <div className="flex items-center gap-3 mb-6 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center font-bold">
                                    {selectedUser.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-white">@{selectedUser.username}</p>
                                    <p className="text-xs text-zinc-500">{selectedUser.real_name} · {selectedUser.territories?.name}</p>
                                </div>
                                {getStatusBadge(selectedUser)}
                            </div>

                            {/* VIEW MODAL */}
                            {modalType === 'view' && (
                                <div className="space-y-4">
                                    <InfoRow label="User ID" value={selectedUser.id} mono />
                                    <InfoRow label="Username" value={`@${selectedUser.username}`} />
                                    <InfoRow label="Real Name" value={selectedUser.real_name || '—'} />
                                    <InfoRow label="Territory" value={selectedUser.territories?.name || '—'} />
                                    <InfoRow label="Verification" value={selectedUser.verification_status} />
                                    <InfoRow label="Joined" value={new Date(selectedUser.created_at).toLocaleString()} />
                                    {selectedUser.is_banned && (
                                        <InfoRow label="Ban Reason" value={selectedUser.ban_reason || '—'} highlight="red" />
                                    )}
                                    {selectedUser.frozen_until && new Date(selectedUser.frozen_until) > new Date() && (
                                        <>
                                            <InfoRow label="Frozen Until" value={new Date(selectedUser.frozen_until).toLocaleString()} highlight="blue" />
                                            <InfoRow label="Freeze Reason" value={selectedUser.freeze_reason || '—'} highlight="blue" />
                                        </>
                                    )}
                                    {selectedUser.admin_notes && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1 font-bold">Admin Notes</p>
                                            <pre className="text-sm text-yellow-300/80 bg-yellow-900/10 border border-yellow-800/30 p-3 rounded-xl whitespace-pre-wrap font-mono">
                                                {selectedUser.admin_notes}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BAN MODAL */}
                            {modalType === 'ban' && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-sm text-red-300 flex items-start gap-2">
                                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                        <span>Banning will permanently prevent this user from posting, chatting, and interacting until manually unbanned.</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-300 mb-2">Reason for ban</label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Harassment, spam, impersonation..."
                                            className="w-full h-24 bg-black border border-zinc-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-red-500"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={closeModal} className="flex-1 py-3 text-zinc-400 hover:text-white font-bold rounded-xl">Cancel</button>
                                        <button
                                            onClick={handleBan}
                                            disabled={actionLoading || !reason}
                                            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Ban size={16} />
                                            {actionLoading ? 'Banning...' : 'Confirm Ban'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* FREEZE MODAL */}
                            {modalType === 'freeze' && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl text-sm text-blue-300 flex items-start gap-2">
                                        <Snowflake size={16} className="mt-0.5 shrink-0" />
                                        <span>Freezing temporarily suspends the user&apos;s ability to post. The account will automatically thaw after the specified duration.</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-300 mb-2">Duration</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { label: '1h', value: '1' },
                                                { label: '6h', value: '6' },
                                                { label: '24h', value: '24' },
                                                { label: '72h', value: '72' },
                                                { label: '1 Week', value: '168' },
                                                { label: '2 Weeks', value: '336' },
                                                { label: '1 Month', value: '720' },
                                                { label: '∞', value: '87600' },
                                            ].map((d) => (
                                                <button
                                                    key={d.value}
                                                    onClick={() => setFreezeDuration(d.value)}
                                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${freezeDuration === d.value
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                                        }`}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-300 mb-2">Reason</label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Warning for inappropriate content..."
                                            className="w-full h-20 bg-black border border-zinc-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={closeModal} className="flex-1 py-3 text-zinc-400 hover:text-white font-bold rounded-xl">Cancel</button>
                                        <button
                                            onClick={handleFreeze}
                                            disabled={actionLoading || !reason}
                                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Snowflake size={16} />
                                            {actionLoading ? 'Freezing...' : 'Confirm Freeze'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* NOTE MODAL */}
                            {modalType === 'note' && (
                                <div className="space-y-4">
                                    {selectedUser.admin_notes && (
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1 font-bold">Existing Notes</p>
                                            <pre className="text-sm text-yellow-300/80 bg-yellow-900/10 border border-yellow-800/30 p-3 rounded-xl whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                                                {selectedUser.admin_notes}
                                            </pre>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-bold text-zinc-300 mb-2">New Note</label>
                                        <textarea
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Internal note about this user..."
                                            className="w-full h-24 bg-black border border-zinc-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={closeModal} className="flex-1 py-3 text-zinc-400 hover:text-white font-bold rounded-xl">Cancel</button>
                                        <button
                                            onClick={handleAddNote}
                                            disabled={actionLoading || !reason}
                                            className="flex-1 py-3 bg-yellow-600 hover:bg-yellow-500 text-black rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <FileText size={16} />
                                            {actionLoading ? 'Saving...' : 'Save Note'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: 'red' | 'blue' }) {
    const colors = highlight === 'red' ? 'text-red-400' : highlight === 'blue' ? 'text-blue-400' : 'text-white';
    return (
        <div className="flex justify-between items-start gap-4">
            <span className="text-sm text-zinc-500 shrink-0">{label}</span>
            <span className={`text-sm text-right ${colors} ${mono ? 'font-mono text-xs' : ''} break-all`}>{value}</span>
        </div>
    );
}
