'use client';

/**
 * /settings/masters/_components/SystemUserManagementContent
 * 行政書士（scrivener）専用の「組織・ユーザー管理」コンテンツ
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  UserPlus,
  Loader2,
  ShieldCheck,
  User,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import type { Organization, User as DBUser, UserRole } from '@/types/database';
import {
  ORGANIZATION_TYPE_LABELS,
  USER_ROLE_LABELS,
  type OrganizationType,
} from '@/types/database';
import {
  fetchOrganizations,
  deleteOrganization,
  fetchUsers,
  deleteUserAdmin,
  updateUserAdmin,
  updateOrganizationAdmin,
} from '@/lib/api/adminClient';
import { CreateOrgForm } from './CreateOrgForm';
import { CreateUserForm } from './CreateUserForm';

// ─── ユーティリティ ────────────────────────────────────────────────────────────

function orgTypeBadgeClass(type: OrganizationType): string {
  switch (type) {
    case 'union':
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'enterprise':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
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

export function SystemUserManagementContent() {
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
    type: 'union' as OrganizationType,
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
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<DBUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);

  // ── ユーザー編集状態
  const [editUser, setEditUser] = useState<DBUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    displayName: '',
    email: '',
    role: 'union_staff' as UserRole,
  });
  const [updatingUser, setUpdatingUser] = useState(false);

  const canManage = currentUser?.role === 'scrivener';

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
    if (!authLoading && canManage) {
      loadOrganizations();
      loadUsersData();
    }
  }, [authLoading, canManage, loadOrganizations, loadUsersData]);

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

  if (authLoading || (currentUser && !canManage && !authLoading)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const orgCategories = [
    {
      title: '組合（アカウント管理テナント）',
      orgs: organizations.filter((o) => o.type === 'union'),
      emptyMessage: 'まだ組合テナントが登録されていません',
    },
    {
      title: '企業（アカウント管理テナント）',
      orgs: organizations.filter((o) => o.type === 'enterprise'),
      emptyMessage: 'まだ企業テナントが登録されていません',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── ヘッダーアクション ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-600" />
            システム・ユーザー管理
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            行政書士専用 ─ アカウント管理テナントの作成とユーザー発行
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowOrgForm(!showOrgForm); setShowUserForm(false); }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Building2 size={16} />
              テナントを作成
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
      </div>

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

            {loadingOrgs || loadingUsers ? (
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
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">
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
                                title="テナント情報を編集"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteOrg(org);
                                }}
                                className="ml-1 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                title="テナントを削除"
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
                                このテナントにはまだアカウントが発行されていません
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
                                              <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full border border-sky-200">
                                                あなた
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-slate-400 mt-0.5">{usr.email}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-md text-xs font-bold border border-slate-200 text-slate-500">
                                          {USER_ROLE_LABELS[usr.role] || usr.role}
                                        </span>
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

      {/* ─── システム管理者（組織未割当）アカウント一覧 ─── */}
      {canManage && (() => {
        const sysAdmins = usersList.filter((u) => !u.organizationId);
        if (sysAdmins.length === 0) return null;
        return (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden mt-8">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2 text-slate-700">
                <ShieldCheck size={17} className="text-indigo-500" />
                行政書士アカウント（組織横断・フルアクセス）
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
                            <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-xs font-bold rounded-full border border-sky-200">
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
                  テナントの削除
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-700">
                  <span className="font-bold">「{confirmDeleteOrg.name}」</span>を削除しますか？
                </p>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    ⚠️ この操作は元に戻せません。所属ユーザーがいる場合は削除できません。
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">所属テナント（変更不可）</label>
                  <input
                    type="text"
                    disabled
                    value={
                       editUser.organizationId 
                         ? organizations.find((o) => o.id === editUser.organizationId)?.name || '（不明なテナント）'
                         : '（行政書士枠）テナント未所属'
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
                     <p className="text-xs text-rose-500 font-bold mt-1.5 ml-1">※自分自身の権限（ロール）は変更できません。</p>
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
