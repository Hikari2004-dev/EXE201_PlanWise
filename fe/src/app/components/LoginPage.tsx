import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth, API_BASE_URL } from "../context/AuthContext";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Sparkles,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mail,
} from "lucide-react";

export function LoginPage() {
  const { login, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const urlError = searchParams.get("error");
  const currentError = useMemo(() => {
    if (errorMsg) return errorMsg;
    if (urlError === "oauth_failed") return "Đăng nhập bằng Google thất bại. Vui lòng thử lại.";
    if (urlError === "missing_tokens") return "Không tìm thấy token xác thực. Vui lòng đăng nhập lại.";
    if (urlError === "email_not_verified") return "Email chưa được xác thực. Vui lòng kiểm tra Gmail hoặc gửi lại email xác thực.";
    return null;
  }, [errorMsg, urlError]);

  const showResendAction = currentError?.toLowerCase().includes("xác thực") ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const currentOrigin = window.location.origin;
    const callbackUrl = `${currentOrigin}/auth/callback`;
    window.location.href = `${API_BASE_URL}/api/v1/oauth2/authorize/google?redirect_uri=${encodeURIComponent(callbackUrl)}`;
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập email để gửi lại xác thực.");
      return;
    }

    setResendLoading(true);
    setInfoMsg(null);

    try {
      const result = await resendVerification({ email: email.trim() });
      setInfoMsg(result.message);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể gửi lại email xác thực.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 overflow-hidden transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[460px] relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3 animate-pulse">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            Plan<span className="text-indigo-600 dark:text-indigo-400">Wise</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
            Tối ưu hóa thời gian & mục tiêu
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Chào mừng quay trở lại
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Đăng nhập tài khoản của bạn để tiếp tục kế hoạch
            </p>
          </div>

          {currentError && (
            <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 animate-shake">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{currentError}</span>
              </div>

              {showResendAction && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="mt-3 h-9 rounded-xl border-rose-200 bg-white/80 px-3 text-rose-700 hover:bg-white dark:border-rose-500/30 dark:bg-slate-900/40 dark:text-rose-300 dark:hover:bg-slate-900/60"
                >
                  {resendLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Đang gửi lại email...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Gửi lại email xác thực
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-2xl text-xs">
              <Mail size={15} className="shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Địa chỉ email
              </label>
              <Input
                type="email"
                placeholder="ten@vi-du.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || resendLoading}
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <a href="#forgot" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 pl-4 pr-10 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="remember" className="text-xs text-slate-500 dark:text-slate-400 font-medium cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Hoặc tiếp tục với
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 flex items-center justify-center gap-2.5 font-bold transition-all text-slate-700 dark:text-slate-200"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582l3.51-3.51C17.642 1.09 14.974 0 12 0 7.354 0 3.307 2.673 1.341 6.577L5.266 9.765z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.825-.074-1.62-.21-2.385H12v4.51h6.46c-.28 1.48-1.11 2.73-2.37 3.58l3.69 2.87c2.16-1.99 3.71-4.92 3.71-8.575z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235L1.341 17.42c1.966 3.904 6.013 6.577 10.659 6.577 2.974 0 5.688-1.006 7.648-2.732l-3.69-2.87c-1.07.72-2.44 1.15-3.958 1.15-4.229 0-7.818-2.856-9.096-6.66l-3.938 3.149z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.69-2.87c-1.07.72-2.44 1.15-3.958 1.15-4.229 0-7.818-2.856-9.096-6.66l-3.938 3.15A11.96 11.96 0 0 0 12 24z"
              />
            </svg>
            Google
          </Button>
        </div>

        <div className="text-center mb-4">
          <Link
            to="/forgot-password"
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
export default LoginPage;
