import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Sparkles, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await register({ email, password, fullName });
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.message || "Đăng ký thất bại. Email có thể đã được sử dụng.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 overflow-hidden transition-colors duration-300">
      {/* ── Background Blobs ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* ── Main Container ── */}
      <div className="w-full max-w-[460px] relative z-10">
        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3 animate-pulse">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1
            className="text-2xl font-black tracking-tight text-slate-900 dark:text-white"
            style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
          >
            Plan
            <span className="text-indigo-600 dark:text-indigo-400">Wise</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
            Tối ưu hóa thời gian & mục tiêu
          </p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Tạo tài khoản mới
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Đăng ký để bắt đầu lên kế hoạch cuộc sống của bạn
            </p>
          </div>

          {/* ── Error Banner ── */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-2xl text-xs animate-shake">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Họ và tên
              </label>
              <Input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Địa chỉ email
              </label>
              <Input
                type="email"
                placeholder="ten@vi-du.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Mật khẩu
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự"
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

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Xác nhận mật khẩu
              </label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
                required
              />
            </div>

            {/* ── Submit Button ── */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/25 flex items-center justify-center transition-all mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Đang tạo tài khoản...
                </>
              ) : (
                "Đăng ký"
              )}
            </Button>
          </form>
        </div>

        {/* ── Footer Link ── */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 font-medium">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
export default RegisterPage;
