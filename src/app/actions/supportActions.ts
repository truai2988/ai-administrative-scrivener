'use server';

import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { supportSchema } from '@/lib/schemas/supportSchema';
import { z } from 'zod';
import { UserRole } from '@/types/database';

export async function submitSupportInquiry(formData: { subject: string; body: string }) {
  try {
    // 1. Validate Input
    const parsedData = supportSchema.parse(formData);

    // 2. Authenticate User
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return { success: false, error: '認証セッションが見つかりませんでした。再度ログインしてください。' };
    }

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    // 3. Retrieve Context from Firestore Users collection
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, error: 'ユーザー情報が見つかりません。' };
    }

    const userData = userDoc.data()!;
    const userRole = (userData.role as UserRole) || 'applicant';
    const organizationId = userData.organizationId || undefined;
    const tenantId = 'default';
    const senderEmail: string = userData.email || '';
    const senderName: string = userData.displayName || '不明（ユーザー名未登録）';

    // 組織名を取得（失敗しても継続）
    let organizationName = organizationId || '未所属';
    if (organizationId) {
      if (organizationId === 'unassigned') {
        organizationName = '未所属';
      } else {
        try {
          const orgDoc = await adminDb.collection('organizations').doc(organizationId).get();
          if (orgDoc.exists) {
            organizationName = (orgDoc.data()?.name as string) || organizationId;
          }
        } catch {
          // 失敗時はIDをそのまま表示
        }
      }
    }

    // 4. Save to Firestore
    const inquiryRef = adminDb.collection('inquiries').doc();
    const inquiryPayload = {
      id: inquiryRef.id,
      subject: parsedData.subject,
      body: parsedData.body,
      status: 'open',
      createdAt: new Date().toISOString(),
      userId,
      userRole,
      organizationId,
      tenantId,
    };

    await inquiryRef.set(inquiryPayload);

    // 5. Send Notification Email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      const toEmail = process.env.SUPPORT_EMAIL || 'admin@example.com';

      await resend.emails.send({
        from: `システム通知 <${fromEmail}>`,
        to: toEmail,
        // Reply-To に送信者のアドレスを設定。管理者が「返信」を押すと送信者宛に返信できる。
        replyTo: senderEmail ? `${senderName} <${senderEmail}>` : undefined,
        subject: `【サポート便り】${parsedData.subject}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">新しい問い合わせがありました</h2>
            <div style="margin-bottom: 20px; background-color: #f9fafb; padding: 15px; border-radius: 8px;">
              <p style="margin: 0 0 10px;"><strong>件名:</strong> ${parsedData.subject}</p>
              <p style="margin: 0 0 10px;"><strong>送信者:</strong> ${senderName}${senderEmail ? ` &lt;${senderEmail}&gt;` : ''}</p>
              <p style="margin: 0 0 10px;"><strong>組織名:</strong> ${organizationName}</p>
              <p style="margin: 0 0 10px;"><strong>ロール:</strong> ${userRole}</p>
              <p style="margin: 0 0 0;"><strong>ユーザーID:</strong> ${userId}</p>
            </div>
            <h3 style="color: #4b5563; margin-top: 30px;">■ 問い合わせ内容</h3>
            <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; white-space: pre-wrap; font-size: 14px;">${parsedData.body}</div>
            <div style="margin-top: 24px; padding: 12px 16px; background-color: #eef2ff; border-radius: 8px; font-size: 13px; color: #4f46e5;">
              ※このメールにそのまま「返信」すると、送信者（${senderName}）に直接返信できます。
            </div>
          </div>
        `,
      });
    } else {
      console.warn('RESEND_API_KEY environment variable is not set. Email notification skipped.');
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('[submitSupportInquiry] Error:', error);
    // Determine if it is a Zod Error
    if (error instanceof z.ZodError) {
      return { success: false, error: '入力内容に誤りがあります。' };
    }
    return { success: false, error: '問い合わせ処理中にエラーが発生しました。' };
  }
}

export async function updateInquiryStatus(inquiryId: string, newStatus: 'open' | 'in_progress' | 'resolved') {
  try {
    // 1. Authenticate User
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) {
      return { success: false, error: '認証セッションが見つかりませんでした。' };
    }

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    // 2. Check Role (Only scrivener can update status)
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return { success: false, error: 'ユーザー情報が見つかりません。' };
    }

    const userData = userDoc.data();
    if (userData?.role !== 'scrivener') {
      return { success: false, error: '権限がありません。' };
    }

    // 3. Update Status
    await adminDb.collection('inquiries').doc(inquiryId).update({
      status: newStatus,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Inquiry Update Error:', error);
    return { success: false, error: 'ステータスの更新に失敗しました。' };
  }
}

