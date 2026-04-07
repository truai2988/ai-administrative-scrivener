/**
 * 管理用 API クライアント（クライアントサイド呼び出し用）
 *
 * Firebase IDトークンを Authorization ヘッダーに自動付与して
 * /api/admin/* にリクエストを送る。
 */

import { auth } from '@/lib/firebase/auth';
import type { CreateUserRequest } from '@/lib/schemas/organizationSchema';
import type { CreateOrganizationInput } from '@/lib/schemas/organizationSchema';
import type { Organization, OrganizationType } from '@/types/database';

/** 現在ログイン中のユーザーの IDトークンを取得する */
async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('ログインが必要です');
  return user.getIdToken();
}

/** 共通フェッチ（Authorization ヘッダー付き） */
async function adminFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getIdToken();
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

// ── ユーザー管理 ──────────────────────────────────────────────────────────────

export interface CreateUserResult {
  uid: string;
}

/**
 * 新規ユーザーを作成する（scrivener専用）
 * Admin SDKがサーバーサイドで処理するため、呼び出し者はログアウトされない。
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserResult> {
  const res = await adminFetch('/api/admin/create-user', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? 'ユーザーの作成に失敗しました');
  }
  return json as CreateUserResult;
}

export interface UsersResponse {
  users: import('@/types/database').User[];
}

/** ユーザー一覧を取得する（scrivener専用） */
export async function fetchUsers(): Promise<import('@/types/database').User[]> {
  const res = await adminFetch('/api/admin/users');
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? 'ユーザー一覧の取得に失敗しました');
  }
  return (json as UsersResponse).users;
}

/** ユーザーを削除する（scrivener専用） */
export async function deleteUserAdmin(uid: string): Promise<{ message: string }> {
  const res = await adminFetch(`/api/admin/users/${uid}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? 'ユーザーの削除に失敗しました');
  }
  return { message: json.message ?? 'ユーザーを削除しました' };
}
/** ユーザー情報を更新する（scrivener専用） */
export async function updateUserAdmin(
  uid: string,
  data: { email: string; displayName: string; role: string }
): Promise<{ message: string }> {
  const res = await adminFetch(`/api/admin/users/${uid}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? 'ユーザー情報の更新に失敗しました');
  }
  return { message: json.message ?? 'ユーザー情報を更新しました' };
}

// ── 組織管理 ──────────────────────────────────────────────────────────────────

export interface OrganizationsResponse {
  organizations: Organization[];
}

/** 組織一覧を取得する（scrivener専用） */
export async function fetchOrganizations(): Promise<Organization[]> {
  const res = await adminFetch('/api/admin/organizations');
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? '組織一覧の取得に失敗しました');
  }
  return (json as OrganizationsResponse).organizations;
}

/** 新規組織を作成する（scrivener専用） */
export async function createOrganization(
  data: CreateOrganizationInput
): Promise<{ id: string }> {
  const res = await adminFetch('/api/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? '組織の作成に失敗しました');
  }
  return json as { id: string };
}

/** 組織を削除する（scrivener専用） */
export async function deleteOrganization(orgId: string): Promise<{ message: string }> {
  const res = await adminFetch(`/api/admin/organizations/${orgId}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? '組織の削除に失敗しました');
  }
  return { message: json.message ?? '組織を削除しました' };
}

/** 組織情報を更新する（scrivener/hq_admin専用） */
export async function updateOrganizationAdmin(
  orgId: string,
  data: { name?: string; type?: OrganizationType; address?: string; phone?: string }
): Promise<{ message: string }> {
  const res = await adminFetch(`/api/admin/organizations/${orgId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? '組織情報の更新に失敗しました');
  }
  return { message: json.message ?? '組織情報を更新しました' };
}
