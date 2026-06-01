import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");

    if (token && refreshToken) {
      loginWithToken(token, refreshToken)
        .then(() => {
          navigate("/", { replace: true });
        })
        .catch((err) => {
          console.error("OAuth callback error:", err);
          navigate("/login?error=oauth_failed", { replace: true });
        });
    } else {
      console.error("Missing token or refreshToken in OAuth callback");
      navigate("/login?error=missing_tokens", { replace: true });
    }
  }, [searchParams, loginWithToken, navigate]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
          Đang kết nối tài khoản Google...
        </p>
      </div>
    </div>
  );
}
export default AuthCallback;
