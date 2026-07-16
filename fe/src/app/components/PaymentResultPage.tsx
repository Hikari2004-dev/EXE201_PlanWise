import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, XCircle, Loader2, ArrowRight, Sparkles, Code } from "lucide-react";

export function PaymentResultPage() {
  const { fetchWithAuth, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const language = (localStorage.getItem("language") as "vi" | "en") || "vi";

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [mockLoading, setMockLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const verifyTransaction = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const returnedOrderId =
        searchParams.get("orderCode") ||
        searchParams.get("orderId") ||
        searchParams.get("id") ||
        "";
      const returnedStatus = (searchParams.get("status") || "").toUpperCase();
      const isCancelled = ["CANCELLED", "CANCELED", "FAILED"].includes(returnedStatus);

      setOrderId(returnedOrderId);

      if (!returnedOrderId) {
        setSuccess(false);
        setErrorMsg(
          language === "vi"
            ? "Thiếu mã đơn hàng từ PayOS."
            : "Missing order id returned from PayOS."
        );
        setLoading(false);
        return;
      }

      if (isCancelled) {
        setSuccess(false);
        setErrorMsg(
          language === "vi"
            ? "Thanh toán đã bị hủy hoặc thất bại."
            : "Payment was cancelled or failed."
        );
        setLoading(false);
        return;
      }

      try {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          const response = await fetchWithAuth(`/api/v1/subscriptions/transactions/${returnedOrderId}/status`);

          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Payment verification failed");
          }

          const data = await response.json();
          if (cancelled) return;

          if (typeof data.amount === "string") {
            setAmount(Number(data.amount));
          }

          if (data.status === "SUCCESS") {
            setSuccess(true);
            await refreshProfile();
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1500);
            setLoading(false);
            return;
          }

          if (data.status === "FAILED") {
            setSuccess(false);
            setErrorMsg(
              language === "vi"
                ? "Thanh toán không thành công."
                : "Payment was not successful."
            );
            setLoading(false);
            return;
          }

          if (attempt < 5) {
            await sleep(2000);
          }
        }

        setSuccess(false);
        setErrorMsg(
          language === "vi"
            ? "Thanh toán đang chờ PayOS xác nhận. Nếu bạn đang test ở Localhost, hãy dùng nút DEV Mock ở dưới."
            : "Payment is still waiting for PayOS confirmation. If you are testing on localhost, use the DEV Mock button below."
        );
      } catch (err: any) {
        console.error("Verification error:", err);
        setSuccess(false);
        setErrorMsg(
          language === "vi"
            ? `Không thể xác minh giao dịch: ${err.message || "Lỗi xác thực"}. Nếu bạn đang test ở Localhost, hãy click nút DEV Mock ở dưới.`
            : `Could not verify transaction: ${err.message || "Verification error"}. If testing on Localhost, click the DEV Mock button below.`
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    verifyTransaction();

    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, language, refreshProfile]);

  // Dev-only helper to mock verify the payment
  const handleDevMock = async () => {
    if (!orderId) return;
    setMockLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetchWithAuth(`/api/v1/subscriptions/mock-ipn?orderId=${orderId}`, {
        method: "POST",
      });

      if (response.ok) {
        setSuccess(true);
        await refreshProfile();
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to trigger mock IPN");
      }
    } catch (err: any) {
      console.error("Mock IPN error:", err);
      setErrorMsg(
        language === "vi"
          ? `Lỗi Mock IPN: ${err.message}`
          : `Mock IPN Error: ${err.message}`
      );
    } finally {
      setMockLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="max-w-md w-full rounded-3xl bg-slate-900/40 border border-white/[0.05] p-8 text-center backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl"></div>

        {loading ? (
          <div className="py-12 space-y-4">
            <Loader2 size={48} className="animate-spin text-indigo-400 mx-auto" />
            <h2 className="text-xl font-bold tracking-tight">
              {language === "vi" ? "Đang xử lý giao dịch..." : "Processing transaction..."}
            </h2>
            <p className="text-slate-400 text-xs font-medium max-w-xs mx-auto">
              {language === "vi"
                ? "Chúng tôi đang xác thực thông tin thanh toán từ PayOS. Vui lòng giữ nguyên trang web."
                : "We are verifying payment status with PayOS. Please do not close this window."}
            </p>
          </div>
        ) : success ? (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/20">
              <CheckCircle2 size={36} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white flex items-center justify-center gap-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <span>{language === "vi" ? "Thanh Toán Thành Công!" : "Payment Successful!"}</span>
                <Sparkles size={16} className="text-yellow-400 animate-bounce" />
              </h2>
              <p className="text-slate-400 text-xs font-semibold">
                {language === "vi" 
                  ? "Tài khoản của bạn đã được nâng cấp lên Premium." 
                  : "Your account has been upgraded to Premium."}
              </p>
            </div>

            {/* Transaction info */}
            <div className="bg-slate-950/40 border border-white/[0.04] rounded-2xl p-4 text-left text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">{language === "vi" ? "Mã đơn hàng:" : "Order ID:"}</span>
                <span className="text-slate-300 font-mono font-semibold">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === "vi" ? "Số tiền:" : "Amount:"}</span>
                <span className="text-slate-300 font-bold">{formatPrice(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === "vi" ? "Trạng thái:" : "Status:"}</span>
                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded-full scale-90">ACTIVE</span>
              </div>
            </div>

            <button
              onClick={async () => {
                await refreshProfile();
                window.location.href = "/dashboard";
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/20 transition-all"
            >
              <span>{language === "vi" ? "Vào Bảng Điều Khiển" : "Go to Dashboard"}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/20">
              <XCircle size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {language === "vi" ? "Thanh Toán Thất Bại" : "Payment Failed"}
              </h2>
              <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-sm mx-auto">
                {errorMsg || (language === "vi" ? "Đã xảy ra lỗi trong quá trình xử lý giao dịch." : "An error occurred during payment processing.")}
              </p>
            </div>

            {/* DEV Mock Helper — only on localhost */}
            {orderId && ["localhost", "127.0.0.1"].includes(window.location.hostname) && (
              <div className="pt-4 border-t border-white/[0.05] space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 font-semibold text-xs bg-amber-400/10 py-1.5 px-3 rounded-lg w-fit mx-auto border border-amber-400/20">
                  <Code size={14} />
                  <span>DEV ENVIRONMENT</span>
                </div>
                <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                  {language === "vi"
                    ? "Tại môi trường localhost, do PayOS không thể gọi trực tiếp webhook đến máy tính của bạn, bạn có thể click nút dưới đây để kích hoạt giả lập thành công."
                    : "On localhost, because PayOS cannot call your local webhook, you can use the button below to simulate a successful payment notification."}
                </p>
                <button
                  onClick={handleDevMock}
                  disabled={mockLoading}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/[0.05] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {mockLoading ? (
                    <Loader2 size={12} className="animate-spin text-slate-400" />
                  ) : (
                    <>
                      <span>{language === "vi" ? "Giả lập Thanh toán Thành công (Mock IPN)" : "Simulate Success (Mock IPN)"}</span>
                      <Sparkles size={12} className="text-amber-400" />
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/dashboard/pricing")}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/[0.05]"
              >
                {language === "vi" ? "Chọn gói khác" : "Choose package"}
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/[0.05]"
              >
                {language === "vi" ? "Quay lại" : "Back to Home"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
