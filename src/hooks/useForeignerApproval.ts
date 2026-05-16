'use client';

import { useState, useEffect, useCallback } from 'react';
import { foreignerService } from '@/services/foreignerService';
import { Foreigner, UserRole } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { canApproveOrReturn, canRequestReview } from '@/utils/permissions';
import { useToast } from '@/components/ui/Toast';

export function useForeignerApproval(foreignerId?: string) {
  const [foreigner, setForeigner] = useState<Foreigner | null>(null);
  const { currentUser } = useAuth();
  const { show } = useToast();

  useEffect(() => {
    if (!foreignerId) return;
    let cancelled = false;
    foreignerService.getForeignerById(foreignerId).then(data => {
      if (!cancelled && data) setForeigner(data);
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [foreignerId]);

  const userRole = currentUser?.role as UserRole | undefined;
  const isScrivener = userRole === 'scrivener';
  const allowApproveOrReturn = userRole ? canApproveOrReturn(userRole) : false;
  // scrivener は自分自身に確認依頼を送る意味がないので false
  const allowRequestReview = userRole
    ? (!isScrivener && canRequestReview(userRole))
    : false;

  const isStatusDraft = foreigner?.status === '準備中' || foreigner?.status === '編集中' || foreigner?.status === '差し戻し';
  const isStatusPendingReview = foreigner?.approvalStatus === 'pending_review' || foreigner?.status === 'チェック中';
  const isWorkflowDraftOrReturned = !foreigner?.approvalStatus || foreigner?.approvalStatus === 'draft' || foreigner?.approvalStatus === 'returned';

  const hasApproveReturnPermission = allowApproveOrReturn;
  const canExecuteApproveReturn = isStatusPendingReview;

  const hasRequestReviewPermission = allowRequestReview;
  const canExecuteRequestReview = isStatusDraft && isWorkflowDraftOrReturned;

  // scrivener が直接承認できる条件: ドラフト/差し戻し状態で、承認待ちでないとき
  const canExecuteDirectApprove = isScrivener && isStatusDraft && isWorkflowDraftOrReturned;

  const handleApprove = useCallback(async () => {
    if (!foreigner) return;
    if (!confirm('このデータを承認し、「申請済」にしますか？')) return;
    try {
      await foreignerService.updateApprovalStatus(foreigner.id, 'approved');
      setForeigner(prev => prev ? { ...prev, approvalStatus: 'approved', status: '申請済' } : null);
      show('success', '承認しました');
    } catch (err) {
      console.error(err);
      show('error', 'エラーが発生しました');
    }
  }, [foreigner, show]);

  const handleReturn = useCallback(async () => {
    if (!foreigner) return;
    const reason = window.prompt('差し戻しの理由を入力してください');
    if (reason === null) return;
    try {
      await foreignerService.updateApprovalStatus(foreigner.id, 'returned', reason);
      setForeigner(prev => prev ? { ...prev, approvalStatus: 'returned', returnReason: reason, status: '差し戻し' } : null);
      show('success', '差し戻しました');
    } catch (err) {
      console.error(err);
      show('error', 'エラーが発生しました');
    }
  }, [foreigner, show]);

  const handleRequestReview = useCallback(async () => {
    if (!foreigner) return;
    if (!confirm('行政書士に内容の確認を依頼しますか？')) return;
    try {
      await foreignerService.updateApprovalStatus(foreigner.id, 'pending_review');
      setForeigner(prev => prev ? { ...prev, approvalStatus: 'pending_review', status: 'チェック中' } : null);
      show('success', '確認依頼を送信しました');
    } catch (err) {
      console.error(err);
      show('error', 'エラーが発生しました');
    }
  }, [foreigner, show]);

  /** scrivener専用: 確認依頼をスキップして直接承認する */
  const handleDirectApprove = useCallback(async () => {
    if (!foreigner) return;
    if (!confirm('この内容で承認（完了）しますか？')) return;
    try {
      await foreignerService.updateApprovalStatus(foreigner.id, 'approved');
      setForeigner(prev => prev ? { ...prev, approvalStatus: 'approved', status: '申請済' } : null);
      show('success', '承認しました（申請済に変更）');
    } catch (err) {
      console.error(err);
      show('error', 'エラーが発生しました');
    }
  }, [foreigner, show]);

  // union_staff / enterprise_staff 用
  const isUploader = userRole === 'union_staff' || userRole === 'enterprise_staff';
  const canNotifySubmission = isUploader && isStatusDraft && isWorkflowDraftOrReturned;

  /** union_staff / enterprise_staff 用: 書類提出完了を行政書士に通知する */
  const handleNotifyDocumentSubmission = useCallback(async () => {
    if (!foreigner) return;
    if (!confirm('行政書士に書類提出完了を通知しますか？\nステータスが「チェック中」に変更されます。')) return;
    try {
      await foreignerService.updateApprovalStatus(foreigner.id, 'pending_review');
      setForeigner(prev => prev ? { ...prev, approvalStatus: 'pending_review', status: 'チェック中' } : null);
      show('success', '行政書士に書類提出完了を通知しました');
    } catch (err) {
      console.error(err);
      show('error', 'エラーが発生しました');
    }
  }, [foreigner, show]);

  return {
    foreigner,
    isScrivener,
    isUploader,
    hasApproveReturnPermission,
    canExecuteApproveReturn,
    hasRequestReviewPermission,
    canExecuteRequestReview,
    canExecuteDirectApprove,
    canNotifySubmission,
    handleApprove,
    handleReturn,
    handleRequestReview,
    handleDirectApprove,
    handleNotifyDocumentSubmission,
  };
}
