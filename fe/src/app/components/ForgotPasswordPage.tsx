import { useState } from "react";
import { Link } from "react-router";
import { AlertCircle, ArrowLeft, Loader2, Mail, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Vui lòng nhập email của bạn.");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await forgotPassword({ email: email.trim() });
      setStatus("success");
      setMessage(response.message || "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Có lỗi xảy ra. Vui lòng thử lại.");
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
            Khôi phục mật khẩu
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          {status === "success" ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <Mail size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-950 dark:text-white mb-2">
                Kiểm tra email của bạn
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-6 mb-6">
                {message}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                Nếu không thấy email, hãy kiểm tra thư mục Spam.
              </p>
              <Button
                onClick={() => window.location.href = "/login"}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
              >
                Quay lại đăng nhập
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-6">
                  Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu.
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
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="ten@vi-du.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi liên kết đặt lại mật khẩu"
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
              <ArrowLeft size={16} />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 font-medium">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
