"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { LayoutDashboard, Mail, Lock, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Next.jsの router.push では即座にセットしたCookieがMiddlewareのルーティングに
      // 反映されず、再度/loginにリダイレクトされてしまうことがあるため、Locationで遷移させます。
      window.location.href = "/";
    } catch (err: unknown) {
      console.error("Login error:", err);
      const firebaseError = err as { code?: string };
      switch (firebaseError.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("メールアドレスまたはパスワードが正しくありません。");
          break;
        case "auth/too-many-requests":
          setError("ログイン試行回数が多すぎます。しばらく待ってから再度お試しください。");
          break;
        default:
          setError("ログインに失敗しました。もう一度お試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 bg-linear-to-br from-indigo-600 to-violet-700 rounded-xl shadow-lg shadow-indigo-200/50 mb-3">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-600 tracking-tight">
            Noctiluca
          </h1>
        </div>

        {/* Concept Banner */}
        <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-6 shadow-lg shadow-indigo-200/40 mb-6 w-full">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-4 right-6 w-1 h-1 bg-white/30 rounded-full" />
          <div className="absolute top-8 right-10 w-1.5 h-1.5 bg-white/20 rounded-full" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
               <span className="px-2 py-0.5 bg-white/15 backdrop-blur-sm text-white text-[9px] font-bold rounded-full border border-white/20 tracking-wider uppercase">
                 Noctiluca Demo
               </span>
               <span className="px-2 py-0.5 bg-emerald-500/40 backdrop-blur-sm text-white text-[9px] font-bold rounded-full border border-white/20 tracking-wider">
                 行政書士
               </span>
            </div>
            <h2 className="text-[13px] md:text-[14px] font-black text-white leading-snug mb-2 tracking-tight">
              行政監査は「書類の有無」から、<br />「プロセスの正当性とデータの完全な整合性」へ。
            </h2>
            <p className="text-[9px] md:text-[10px] text-indigo-100 font-medium">
              法改正リスクをゼロにする、AI労務管理システムへようこそ
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-black text-slate-900 mb-1">ログイン</h2>
            <p className="text-sm text-slate-500 font-medium mb-8">
              アカウント情報を入力してください
            </p>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-6"
              >
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    suppressHydrationWarning
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    suppressHydrationWarning
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-linear-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-200/70 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    認証中...
                  </>
                ) : (
                  "ログイン"
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-slate-50/50 border-t border-slate-100 px-8 py-4">
            <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
              アクセス権限の設定はシステム管理者にお問い合わせください。
              <br />
              不正アクセスは法律により罰せられます。
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
