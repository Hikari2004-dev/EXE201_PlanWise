import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const hasReset = useRef(false);

  const hasToken = useMemo(() => token.length > 0, [token]);

  const passwordValidation = useMemo(() => {
    const errors: string[] = [];
    if (password.length < 6) {
      errors.push("Ít nhất 6 ký tự");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Ít nhất 1 chữ hoa");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Ít nhất 1 chữ thường");
    }
    if (!/\d/.test(password)) {
      errors.push("Ít nhất 1 số");
    }
    return errors;
  }, [password]);

  const isPasswordValid = passwordValidation.length === 0;

  useEffect(() => {
    if (!hasToken || hasReset.current) {
      setStatus("idle");
      if (!hasToken) {
        setMessage("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      }
      return;
    }

    hasReset.current = true;
  }, [hasToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setStatus("error");
      setMessage("Vui lòng nhập mật khẩu mới.");
      return;
    }

    if (!isPasswordValid) {
      setStatus("error");
      setMessage("Mật khẩu không đáp ứng yêu cầu: " + passwordValidation.join(", "));
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await resetPassword({ token, newPassword: password });
      setStatus("success");
      setMessage(response.message || "Đặt lại mật khẩu thành công!");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Có lỗi xảy ra. Liên kết có thể đã hết hạn.");
      hasReset.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 overflow-hidden transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[520px] relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            Plan<span className="text-indigo-600 dark:text-indigo-400">Wise</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
            Đặt lại mật khẩu mới
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          {status === "success" ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-2">
                Đặt lại mật khẩu thành công
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-6 mb-6">
                {message}
              </p>
              <Button
                onClick={() => window.location.href = "/login"}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
              >
                Đăng nhập ngay
              </Button>
            </div>
          ) : !hasToken ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                <AlertCircle size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-2">
                Liên kết không hợp lệ
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-6 mb-6">
                {message}
              </p>
              <Button
                onClick={() => window.location.href = "/forgot-password"}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
              >
                Yêu cầu liên kết mới
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <Lock size={24} />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-6">
                  Nhập mật khẩu mới cho tài khoản của bạn.
                </p>
              </div>

              {status === "error" && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-500/10 p-3 flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
                  <AlertCircle size={16} />
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu mới"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="h-11 px-4 pr-10 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {["Ít nhất 6 ký tự", "Ít nhất 1 chữ hoa", "Ít nhất 1 chữ thường", "Ít nhất 1 số"].map((req) => {
                        const met = !passwordValidation.includes(req);
                        return (
                          <div
                            key={req}
                            className={`flex items-center gap-2 text-xs ${
                              met ? "text-emerald-600" : "text-slate-400"
                            }`}
                          >
                            {met ? "✓" : "○"} {req}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="h-11 px-4 pr-10 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-rose-500">Mật khẩu không khớp</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !isPasswordValid || password !== confirmPassword}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Đặt lại mật khẩu"
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 flex items-center justify-center">
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
