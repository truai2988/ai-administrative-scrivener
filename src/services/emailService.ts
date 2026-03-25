import { resend } from '../lib/resend';
import { Foreigner } from '../types/database';

export const emailService = {
  /**
   * 送信テスト
   */
  async sendTestEmail(to: string) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Visa Manager <onboarding@resend.dev>',
        to: [to],
        subject: 'Resend Integration Test',
        html: '<strong>Hello! Resend is successfully integrated into Visa Manager.</strong>',
      });

      if (error) {
        console.error('Resend Error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('Email Service Error:', err);
      return { success: false, error: err };
    }
  },

  /**
   * 在留期限アラートの送信
   */
  async sendExpiryAlert(foreigner: Foreigner) {
    if (!foreigner.email) return;

    return await resend.emails.send({
      from: 'Visa Manager <onboarding@resend.dev>',
      to: [foreigner.email],
      subject: `【重要】在留カード期限のお知らせ (${foreigner.name}様)`,
      html: `
        <h2>在留カードの期限が近づいています</h2>
        <p>${foreigner.name} 様</p>
        <p>現在お持ちの在留カードの期限は <strong>${foreigner.expiryDate}</strong> です。</p>
        <p>更新手続きの準備を開始してください。</p>
      `,
    });
  },

  /**
   * ステータス更新通知
   */
  async sendStatusUpdateNotification(foreigner: Foreigner) {
    if (!foreigner.email) return;

    return await resend.emails.send({
      from: 'Visa Manager <onboarding@resend.dev>',
      to: [foreigner.email],
      subject: `申請ステータス更新のお知らせ (${foreigner.name}様)`,
      html: `
        <h2>申請ステータスが更新されました</h2>
        <p>${foreigner.name} 様</p>
        <p>現在のステータス: <strong>${foreigner.status}</strong></p>
        <p>詳細はダッシュボードからご確認ください。</p>
      `,
    });
  }
};
