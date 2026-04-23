import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Proxy: 未ログインユーザーのリダイレクト
 * 
 * クライアント側（React Context）のみに依存すると画面の「ちらつき」が発生するため、
 * サーバーサイドでセッションCookie（__session）の有無を判定し、
 * 未ログインユーザーを /login にリダイレクトする。
 * 
 * 注意: Firebase Auth のJWTの完全な検証（署名検証）にはサーバーサイドの
 * Firebase Admin SDK が必要。このMiddlewareではCookieの存在チェックのみ行い、
 * 詳細な権限チェックはクライアント側の AuthContext で実施する。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保護対象外のパスをスキップ
  const publicPaths = [
    "/login",
    "/foreigner/entry",  // 外国人本人が入力するフォーム
    "/forms/renewal",    // 在留期間更新許可申請書フォーム
    "/api",
    "/_next",
    "/favicon.ico",
  ];

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  if (isPublicPath) {
    return NextResponse.next();
  }

  // セッションCookieの存在チェック
  const sessionCookie = request.cookies.get("__session");

  if (!sessionCookie?.value) {
    // 未ログイン: /login にリダイレクト
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除外:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico
     * - public フォルダ内のファイル
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
