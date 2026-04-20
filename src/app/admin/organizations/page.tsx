'use client';

/**
 * /admin/organizations
 * 行政書士（scrivener）専用の「組織・ユーザー管理」画面
 *
 * 機能:
 *  1. 組織（支部・企業・本部）の新規作成
 *  2. 作成した組織への新規ユーザーアカウント発行
 *  3. 組織一覧の表示
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  UserPlus,
  Plus,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Tag,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

import type { Organization, User as DBUser } from '@/types/database';
import {
  ORGANIZATION_TYPE_LABELS,
  USER_ROLE_LABELS,
  type OrganizationType,
} from '@/types/database';
import type { UserRole } from '@/types/database';
import {
  fetchOrganizations,
  deleteOrganization,
  fetchUsers,
  deleteUserAdmin,
  updateUserAdmin,
  updateOrganizationAdmin,
} from '@/lib/api/adminClient';
import { CreateOrgForm } from './_components/CreateOrgForm';
import { CreateUserForm } from './_components/CreateUserForm';

// ─── ユーティリティ ────────────────────────────────────────────────────────────

function orgTypeBadgeClass(type: OrganizationType): string {
  switch (type) {
    case 'hq':
      return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'branch':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'enterprise':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
}

function roleToOrganizationType(role: UserRole): OrganizationType | 'any' {
  switch (role) {
    case 'hq_admin':
      return 'hq';
    case 'branch_staff':
      return 'branch';
    case 'enterprise_staff':
      return 'enterprise';
    default:
      return 'any'; // scrivener は組織不要
  }
}

// ─── トースト型（ローカル）────────────────────────────────────────────────────

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

function useLocalToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, dismiss };
}

// ─── メインコンポーネント ────────────────────────────────────────────────────

export default function AdminOrganizationsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toasts, show: showToast, dismiss } = useLocalToast();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);

  // ── 組織作成フォーム状態
  const [showOrgForm, setShowOrgForm] = useState(false);

  // ── 組織編集フォーム状態
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [editOrgForm, setEditOrgForm] = useState({
    name: '',
    type: 'branch' as OrganizationType,
    address: '',
    phone: '',
  });
  const [updatingOrg, setUpdatingOrg] = useState(false);

  // ── ユーザー作成フォーム状態
  const [showUserForm, setShowUserForm] = useState(false);

  // 削除確認ダイアログの状態
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState(false);

  // ── ユーザー一覧状態
  const [usersList, setUsersList] = useState<DBUser[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<DBUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);

  // ── ユーザー編集状態
  const [editUser, setEditUser] = useState<DBUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    displayName: '',
    email: '',
    role: 'branch_staff' as UserRole,
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  // ── 権限フラグ
  // 組織の作成・削除・ユーザー管理が可能なロール
  const canManage = currentUser?.role === 'scrivener' || currentUser?.role === 'hq_admin';
  // 支部事務員（閲覧専用）
  const isStaffViewer = currentUser?.role === 'branch_staff';

  // ── 認証ガード
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // enterprise_staff は組織管理ページへのアクセス不可
    if (currentUser.role === 'enterprise_staff') {
      router.push('/');
    }
  }, [currentUser, authLoading, router]);

  // ── 組織一覧ロード
  const loadOrganizations = useCallback(async () => {
    setLoadingOrgs(true);
    try {
      const orgs = await fetchOrganizations();
      setOrganizations(orgs);
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message ?? '組織一覧の取得に失敗しました');
    } finally {
      setLoadingOrgs(false);
    }
  }, [showToast]);

  // ── ユーザー一覧ロード
  const loadUsersData = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const u = await fetchUsers();
      setUsersList(u);
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message ?? 'ユーザー一覧の取得に失敗しました');
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────
  // 3. アカウント更新（API通信）
  // ─────────────────────────────────────────────────────────────────
  const handleUpdateUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setUpdatingUser(true);
    try {
      const res = await updateUserAdmin(editUser.id, editUserForm);
      showToast('success', res.message);
      setEditUser(null);
      await loadUsersData(); // 一覧リロード
    } catch (err: unknown) {
      const error = err as Error;
      showToast('error', error.message ?? '更新に失敗しました。');
    } finally {
      setUpdatingUser(false);
    }
  }, [editUser, editUserForm, loadUsersData, showToast]);

  useEffect(() => {
    // scrivener / hq_admin がアクセス可能
    const canView = currentUser?.role === 'scrivener' || currentUser?.role === 'hq_admin';
    if (!authLoading && canView) {
      loadOrganizations();
      loadUsersData();
    }
  }, [authLoading, currentUser, loadOrganizations, loadUsersData]);


  // ―― 組織削除ハンドラ
  const handleDeleteOrg = async () => {
    if (!confirmDeleteOrg) return;
    setDeletingOrg(true);
    try {
      const result = await deleteOrganization(confirmDeleteOrg.id);
      showToast('success', result.message);
      setConfirmDeleteOrg(null);
      loadOrganizations();
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message ?? '組織の削除に失敗しました');
      setConfirmDeleteOrg(null);
    } finally {
      setDeletingOrg(false);
    }
  };

  // ―― 組織更新ハンドラ
  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrg) return;

    setUpdatingOrg(true);
    try {
      const result = await updateOrganizationAdmin(editOrg.id, editOrgForm);
      showToast('success', result.message);
      setEditOrg(null);
      loadOrganizations(); // リロード
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message ?? '組織の更新に失敗しました');
    } finally {
      setUpdatingOrg(false);
    }
  };

  // ―― ユーザー削除ハンドラ
  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setDeletingUser(true);
    try {
      const result = await deleteUserAdmin(confirmDeleteUser.id);
      showToast('success', result.message);
      setConfirmDeleteUser(null);
      loadUsersData();
    } catch (err: unknown) {
      const e = err as Error;
      showToast('error', e.message ?? 'ユーザーの削除に失敗しました');
      setConfirmDeleteUser(null);
    } finally {
      setDeletingUser(false);
    }
  };

  // ── ロードガード表示
  const allowedRoles = ['scrivener', 'hq_admin'];
  if (authLoading || (currentUser && !allowedRoles.includes(currentUser.role) && !authLoading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // 組織をカテゴリー別に分ける（本部は管理対象外のため表示しない）
  const orgCategories = [
    {
      title: '支援団体（支部）',
      orgs: organizations.filter((o) => o.type === 'branch'),
      emptyMessage: 'まだ支部が登録されていません',
    },
    {
      title: '所属団体（受入企業）',
      orgs: organizations.filter((o) => o.type === 'enterprise'),
      emptyMessage: 'まだ所属団体（受入企業）が登録されていません',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* ─── ヘッダー ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShieldCheck size={22} className="text-indigo-600" />
                組織・ユーザー管理
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {canManage
                  ? '本部・管理者専用 ─ 組織の作成とアカウント発行'
                  : isStaffViewer
                  ? '閲覧専用モード ─ 自分の所属支部のみ表示'
                  : '組織の確認'}
              </p>
            </div>
          </div>

          {/* 管理権限（scrivener / hq_admin）のみボタンを表示 */}
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowOrgForm(!showOrgForm); setShowUserForm(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-xs"
              >
                <Building2 size={16} />
                組織を追加
              </button>
              <button
                onClick={() => { setShowUserForm(!showUserForm); setShowOrgForm(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <UserPlus size={16} />
                ユーザーを発行
              </button>
            </div>
          )}
          {/* branch_staff 向け: 閲覧専用バッジ */}
          {isStaffViewer && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl">
              <ShieldCheck size={13} />
              閲覧専用
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ─── 組織作成フォーム ───────────────────────────────────────────── */}
        <CreateOrgForm
          showForm={showOrgForm}
          onClose={() => setShowOrgForm(false)}
          onSuccess={() => {
            setShowOrgForm(false);
            loadOrganizations();
          }}
          showToast={showToast}
        />

        {/* ─── ユーザー発行フォーム ────────────────────────────────────────── */}
        <CreateUserForm
          showForm={showUserForm}
          onClose={() => setShowUserForm(false)}
          onSuccess={() => {
            setShowUserForm(false);
            loadUsersData();
          }}
          showToast={showToast}
          organizations={organizations}
        />


        {/* ─── 組織一覧 ─────────────────────────────────────────────────────── */}
        <div className="space-y-8">
          {orgCategories.map((cat, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Building2 size={17} className="text-slate-500" />
                  {cat.title}
                  <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                    {cat.orgs.length}
                  </span>
                </h2>
              </div>

              {loadingOrgs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
                </div>
              ) : cat.orgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Building2 size={36} className="text-slate-200" />
                  <p className="text-sm font-medium">{cat.emptyMessage}</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cat.orgs.map((org) => {
                    const orgUsers = usersList.filter(u => u.organizationId === org.id);
                    const isExpanded = expandedOrgId === org.id;
                    return (
                      <div key={org.id} className="flex flex-col">
                        <div
                          onClick={() => setExpandedOrgId(isExpanded ? null : org.id)}
                          className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <button type="button" className="p-1 text-slate-400 hover:text-slate-600 rounded">
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center">
                              <Building2 size={17} className="text-slate-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-800">{org.name}</p>
                                {orgUsers.length > 0 && (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">
                                    {orgUsers.length} アカウント
                                  </span>
                                )}
                              </div>
                              {org.address && (
                                <p className="text-xs text-slate-400 mt-0.5">{org.address}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${orgTypeBadgeClass(org.type)}`}
                            >
                              {ORGANIZATION_TYPE_LABELS[org.type]}
                            </span>
                            <span className="text-xs text-slate-400 font-mono hidden sm:inline">{org.id.slice(0, 8)}…</span>
                            {/* 編集・削除ボタン: 管理権限のみ表示 */}
                            {canManage && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditOrgForm({
                                      name: org.name,
                                      type: org.type,
                                      address: org.address || '',
                                      phone: org.phone || '',
                                    });
                                    setEditOrg(org);
                                  }}
                                  className="ml-2 p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                                  title="組織を編集"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteOrg(org);
                                  }}
                                  className="ml-1 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="組織を削除"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* アコーディオン: 組織に所属するアカウント一覧 */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden bg-slate-50/80 border-t border-slate-100"
                            >
                              {orgUsers.length === 0 ? (
                                <div className="py-6 text-center text-sm text-slate-400 font-medium">
                                  この組織にはまだアカウントが発行されていません
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100 pl-14">
                                  {orgUsers.map((usr) => {
                                    const isSelf = currentUser?.id === usr.id;
                                    return (
                                      <div key={usr.id} className="flex items-center justify-between py-3 pr-5">
                                        <div className="flex items-center gap-3">
                                          <User size={15} className="text-slate-400" />
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm font-bold text-slate-700">{usr.displayName}</p>
                                              {isSelf && (
                                                <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded-full border border-sky-200">
                                                  あなた
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">{usr.email}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="px-2 py-1 rounded-md text-[10px] font-bold border border-slate-200 text-slate-500">
                                            {USER_ROLE_LABELS[usr.role] || usr.role}
                                          </span>
                                          {/* 編集・削除ボタン: 管理権限のみ表示 */}
                                          {canManage && (
                                            <>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditUserForm({
                                                    displayName: usr.displayName,
                                                    email: usr.email,
                                                    role: usr.role,
                                                  });
                                                  setEditUser(usr);
                                                }}
                                                className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                                                title="アカウントを編集"
                                              >
                                                <Pencil size={13} />
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConfirmDeleteUser(usr);
                                                }}
                                                disabled={isSelf}
                                                className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-30"
                                                title={isSelf ? '自分自身は削除できません' : 'アカウントを削除'}
                                              >
                                                <Trash2 size={13} />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ─── システム管理者（組織未割当）アカウント一覧: 管理権限のみ表示 ─── */}
        {canManage && (() => {
          // 東京本部（hq_direct）所属 または 組織未所属のユーザーを特権管理者として表示
          const sysAdmins = usersList.filter((u) => !u.organizationId || u.organizationId === 'hq_direct');
          if (sysAdmins.length === 0) return null;
          return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-8">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h2 className="font-bold text-base flex items-center gap-2 text-slate-700">
                  <ShieldCheck size={17} className="text-indigo-500" />
                  特権管理者アカウント（東京本部・組織未所属）
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {sysAdmins.map((usr) => {
                  const isSelf = currentUser?.id === usr.id;
                  return (
                    <div
                      key={usr.id}
                      className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                          <User size={17} className="text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-800">{usr.displayName}</p>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-bold rounded-full border border-sky-200">
                                あなた
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{usr.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-200 text-indigo-600 bg-indigo-50">
                          {USER_ROLE_LABELS[usr.role] || usr.role}
                        </span>
                        <button
                          onClick={() => {
                            setEditUserForm({
                              displayName: usr.displayName,
                              email: usr.email,
                              role: usr.role,
                            });
                            setEditUser(usr);
                          }}
                          className="ml-2 p-1.5 rounded-lg text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                          title="アカウントを編集"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteUser(usr)}
                          disabled={isSelf}
                          className="ml-2 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                          title={isSelf ? 'ログイン中の自分自身は削除できません' : 'アカウントを削除'}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </main>

      {/* ─── 組織削除確認ダイアログ ────────────────────────────── */}
      <AnimatePresence>
        {confirmDeleteOrg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 bg-rose-50/50">
                <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
                  <Trash2 size={17} />
                  組織の削除
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-700">
                  <span className="font-bold">「{confirmDeleteOrg.name}」</span>を削除しますか？
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    ⚠️ この操作は元に戻せません。尊属ユーザーがいる場合は削除できません。
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOrg(null)}
                    disabled={deletingOrg}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteOrg}
                    disabled={deletingOrg}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {deletingOrg ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    削除する
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ユーザー削除確認ダイアログ ────────────────────────────── */}
      <AnimatePresence>
        {confirmDeleteUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 bg-rose-50/50">
                <h3 className="font-bold text-base text-rose-700 flex items-center gap-2">
                  <Trash2 size={17} />
                  アカウントの削除
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-700">
                  <span className="font-bold">「{confirmDeleteUser.displayName}」</span>を削除しますか？
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    ⚠️ この操作は復旧できません。認証情報（ログイン権限）とデータベース上のプロフィール情報が完全に削除されます。
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteUser(null)}
                    disabled={deletingUser}
                    className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={deletingUser}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors disabled:opacity-50"
                  >
                    {deletingUser ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    削除する
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ユーザー情報編集モーダル ────────────────────────────── */}
      <AnimatePresence>
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setEditUser(null)}
                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-black text-slate-800 mb-2">ユーザー情報の編集</h3>
              <p className="text-sm text-slate-500 mb-6">名前、メールアドレス、アクセス権限を更新します。</p>

              <form onSubmit={handleUpdateUser} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">所属している組織（変更不可）</label>
                  <input
                    type="text"
                    disabled
                    value={
                       editUser.organizationId 
                         ? organizations.find((o) => o.id === editUser.organizationId)?.name || '（不明な組織）'
                         : '（システム管理者枠）未所属'
                    }
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">氏名 (表示名) *</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.displayName}
                    onChange={(e) => setEditUserForm({ ...editUserForm, displayName: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">メールアドレス *</label>
                  <input
                    type="email"
                    required
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">アクセス権限 (ロール) *</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as UserRole })}
                    disabled={currentUser?.id === editUser.id}
                    className={`w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all font-medium appearance-none ${
                        currentUser?.id === editUser.id ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer'
                    }`}
                  >
                    <option value="" disabled>権限を選択してください</option>
                    {Object.entries(USER_ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label as string} {val === 'scrivener' && '(フルアクセス)'}
                      </option>
                    ))}
                  </select>
                  {currentUser?.id === editUser.id && (
                     <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">※自分自身の権限（ロール）は変更できません。</p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    disabled={updatingUser}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={updatingUser || !editUserForm.email || !editUserForm.displayName || !editUserForm.role}
                    className="flex-1 flex justify-center items-center py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {updatingUser ? <Loader2 size={18} className="animate-spin" /> : '更新を保存'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 組織情報編集モーダル ────────────────────────────── */}
      <AnimatePresence>
        {editOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setEditOrg(null)}
                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <h3 className="text-xl font-black text-slate-800 mb-2">組織情報の編集</h3>
              <p className="text-sm text-slate-500 mb-6">組織名、種類、連絡先を更新します。</p>

              <form onSubmit={handleUpdateOrg} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">組織名 *</label>
                  <input
                    type="text"
                    required
                    value={editOrgForm.name}
                    onChange={(e) => setEditOrgForm({ ...editOrgForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">種別 *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['branch', 'enterprise'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditOrgForm({ ...editOrgForm, type: t as OrganizationType })}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          editOrgForm.type === t
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {ORGANIZATION_TYPE_LABELS[t as keyof typeof ORGANIZATION_TYPE_LABELS]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">住所（任意）</label>
                  <input
                    type="text"
                    value={editOrgForm.address}
                    onChange={(e) => setEditOrgForm({ ...editOrgForm, address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">電話番号（任意）</label>
                  <input
                    type="tel"
                    value={editOrgForm.phone}
                    onChange={(e) => setEditOrgForm({ ...editOrgForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditOrg(null)}
                    disabled={updatingOrg}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={updatingOrg || !editOrgForm.name}
                    className="flex-1 flex justify-center items-center py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                    {updatingOrg ? <Loader2 size={18} className="animate-spin" /> : '更新を保存'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── トースト通知 ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-bold ${
                toast.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {toast.message}
              <button
                onClick={() => dismiss(toast.id)}
                className="ml-1 hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
