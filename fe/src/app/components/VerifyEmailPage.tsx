import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function VerifyEmailPage() {
  const { verifyEmail, resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token")?.trim() ?? "";
  const prefilledEmail = searchParams.get("email")?.trim() ?? "";

  const [email, setEmail] = useState(prefilledEmail);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const hasToken = useMemo(() => token.length > 0, [token]);

  useEffect(() => {
    if (!hasToken) {
      setStatus("idle");
      setMessage("Vui lòng mở liên kết xác thực trong email hoặc yêu cầu gửi lại email xác thực.");
      return;
    }

    const runVerification = async () => {
      setVerifying(true);
      setStatus("idle");
      setMessage("Đang xác thực email của bạn...");

      try {
        const response = await verifyEmail(token);
        setStatus("success");
        setMessage(response.message || "Xác thực email thành công.");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Liên kết xác thực không hợp lệ hoặc đã hết hạn.");
      } finally {
        setVerifying(false);
      }
    };

    void runVerification();
  }, [hasToken, token, verifyEmail]);

  const handleResend = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      setMessage("Vui lòng nhập email đã dùng để đăng ký.");
      return;
    }

    setResending(true);
    try {
      const response = await resendVerification({ email: email.trim() });
      setStatus("success");
      setMessage(response.message || "Đã gửi lại email xác thực.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Không thể gửi lại email xác thực.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#020617] p-4 overflow-hidden transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[520px] relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3 animate-pulse">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            Plan<span className="text-indigo-600 dark:text-indigo-400">Wise</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mt-1">
            Xác thực Gmail để kích hoạt tài khoản
          </p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {verifying ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : status === "success" ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : status === "error" ? (
                <AlertCircle className="h-6 w-6" />
              ) : (
                <Mail className="h-6 w-6" />
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              {verifying
                ? "Đang xác thực email"
                : status === "success"
                  ? "Email đã được xác thực"
                  : "Xác thực tài khoản"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-6">
              {message}
            </p>
          </div>

          <div
            className={`mb-6 rounded-2xl border p-4 text-sm ${
              status === "success"
                ? "border-emerald-200 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/50 dark:text-emerald-300"
                : status === "error"
                  ? "border-rose-200 bg-rose-500/10 text-rose-700 dark:border-rose-900/50 dark:text-rose-300"
                  : "border-slate-200 bg-slate-100/70 text-slate-600 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300"
            }`}
          >
            {status === "success"
              ? "Bạn có thể đăng nhập ngay để bắt đầu sử dụng PlanWise."
              : "Nếu bạn chưa thấy email, hãy kiểm tra thư mục Spam hoặc yêu cầu gửi lại email xác thực bên dưới."}
          </div>

          <form onSubmit={handleResend} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                Email đã đăng ký
              </label>
              <Input
                type="email"
                placeholder="ten@vi-du.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resending}
                className="h-11 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-100/50 dark:bg-slate-950/30"
              />
            </div>

            <Button
              type="submit"
              disabled={resending}
              variant="outline"
              className="w-full h-11 rounded-xl border-slate-200 dark:border-slate-800 font-semibold flex items-center justify-center gap-2"
            >
              {resending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang gửi lại email...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Gửi lại email xác thực
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
              onClick={() => navigate("/login")}
            >
              Đi đến đăng nhập
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-800 font-semibold"
              onClick={() => navigate("/register")}
            >
              Tạo tài khoản khác
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6 font-medium">
          Cần đăng ký mới?{" "}
          <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            Quay lại trang đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
