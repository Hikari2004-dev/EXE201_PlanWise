import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { Sparkles, Check, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  description: string;
}

export function PricingPage() {
  const { fetchWithAuth, user } = useAuth();
  const { language } = useData();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetchWithAuth("/api/v1/subscriptions/plans");
        if (response.ok) {
          const data = await response.json();
          // Sort plans by price ascending
          const sorted = data.sort((a: Plan, b: Plan) => a.price - b.price);
          setPlans(sorted);
        } else {
          throw new Error("Cannot load pricing plans");
        }
      } catch (err: any) {
        console.error("Error loading pricing plans:", err);
        setError(language === "vi" ? "Không thể tải danh sách gói. Vui lòng thử lại sau!" : "Failed to load pricing plans. Please try again later!");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [language]);

  const handlePurchase = async (planId: string) => {
    setPurchaseLoading(planId);
    setError(null);
    try {
      const response = await fetchWithAuth("/api/v1/subscriptions/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.payUrl) {
          window.location.href = data.payUrl;
          return;
        }

        throw new Error("No payment URL received");
      } else {
        const errData = await response.json().catch(() => ({}));

        throw new Error(
          errData.message || "Failed to initiate payment"
        );
      }
    } catch (err: any) {
      console.error("Purchase error:", err);

      setError(
        language === "vi"
          ? `Lỗi thanh toán: ${err.message || "Không thể kết nối đến PayOS"}`
          : `Payment error: ${err.message || "Failed to connect to PayOS"}`
      );

      setPurchaseLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const t = {
    title: language === "vi" ? "Mở Khóa Toàn Bộ Sức Mạnh PlanWise" : "Unlock the Full Power of PlanWise",
    subtitle: language === "vi"
      ? "Lên kế hoạch thông minh hơn, xây dựng thói quen bền vững và bứt phá mục tiêu cùng gói Premium."
      : "Plan smarter, build lasting habits, and crush your goals with our Premium plans.",
    freeLabel: language === "vi" ? "Tài khoản hiện tại" : "Current Account",
    popularLabel: language === "vi" ? "Phổ biến nhất" : "Most Popular",
    upgradeBtn: language === "vi" ? "Nâng cấp ngay" : "Upgrade now",
    activeBtn: language === "vi" ? "Đang sử dụng" : "Currently Active",
    expiresAt: language === "vi" ? "Hết hạn vào:" : "Expires on:",
    billingInterval: (months: number) => {
      if (language === "vi") return `Thanh toán mỗi ${months} tháng`;
      return `Billed every ${months} months`;
    },
    featuresTitle: language === "vi" ? "Tính năng độc quyền Premium" : "Exclusive Premium Features",
    featureGoal: language === "vi" ? "Không giới hạn Mục tiêu (Bản miễn phí giới hạn 3)" : "Unlimited Goals (Free limited to 3)",
    featureHabit: language === "vi" ? "Không giới hạn Thói quen (Bản miễn phí giới hạn 3)" : "Unlimited Habits (Free limited to 3)",
    featuerAIGoalPlanner: language === "vi" ? "Lập kế hoạch phân rã mục tiêu thông minh không giới hạn" : "Unlimited interactions with AI Goal Planner for smart goal setting",
    featureAIAssistant: language === "vi" ? "Trợ lý AI sắp xếp lịch trình thông minh không giới hạn" : "Unlimited interactions with AI Assistant for smart scheduling",
    featureCategories: language === "vi" ? "Tự do tạo danh mục & màu sắc tùy biến" : "Custom categories & color personalization",
    featureEarlyAccess: language === "vi" ? "Truy cập sớm các tính năng mới" : "Early access to new features",
    featuresComparison: language === "vi" ? "So sánh các gói" : "Compare Plans",
    featureName: language === "vi" ? "Tính năng" : "Feature",
    freePlan: language === "vi" ? "Miễn phí" : "Free Plan",
    premiumPlan: language === "vi" ? "Premium VIP" : "Premium VIP",
    unlimited: language === "vi" ? "Không giới hạn" : "Unlimited",
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider animate-pulse">
            <Sparkles size={14} />
            <span>PlanWise Premium</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-200 via-white to-violet-200 bg-clip-text text-transparent" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {t.title}
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-medium">
            {t.subtitle}
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-300 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Pricing Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 rounded-3xl bg-slate-900/40 border border-white/[0.05] p-6 flex flex-col justify-between animate-pulse">
                <div className="space-y-4">
                  <div className="h-6 w-24 bg-slate-800 rounded-lg"></div>
                  <div className="h-10 w-36 bg-slate-800 rounded-lg"></div>
                  <div className="h-4 w-40 bg-slate-800 rounded-lg"></div>
                </div>
                <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isPopular = plan.durationMonths === 6 || plan.durationMonths === 12; // Highlighting longer options
              const isActivePlan = user?.isPremium && user?.premiumExpiresAt; // Need to verify if the active sub is this specific one or just premium

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 border backdrop-blur-md hover:-translate-y-2
                    ${isPopular
                      ? "bg-gradient-to-b from-indigo-950/40 via-indigo-950/20 to-slate-950/40 border-indigo-500/40 shadow-xl shadow-indigo-950/30"
                      : "bg-slate-900/30 border-white/[0.05] hover:border-white/10"
                    }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 right-6 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      {t.popularLabel}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="text-slate-400 font-bold text-sm tracking-wide uppercase">
                      {plan.name}
                    </div>

                    <div className="space-y-1">
                      <div className="text-3xl font-black text-white tracking-tight">
                        {formatPrice(plan.price)}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        {plan.durationMonths === 12
                          ? (language === "vi" ? "1 Năm" : "1 Year")
                          : `${plan.durationMonths} ${language === "vi" ? "Tháng" : "Months"}`}
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-8">
                    {false ? (
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl text-center text-xs font-bold bg-slate-800 text-slate-500 border border-white/[0.05]"
                      >
                        {t.activeBtn}
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePurchase(plan.id)}
                        disabled={purchaseLoading !== null}
                        className={`w-full py-3.5 px-4 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer
                          ${purchaseLoading === plan.id
                            ? "bg-slate-800 text-slate-400 border border-white/[0.05] cursor-not-allowed"
                            : isPopular
                              ? "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35"
                              : "bg-white text-slate-900 hover:bg-slate-100"
                          }`}
                      >
                        {purchaseLoading === plan.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <>
                            <span>{t.upgradeBtn}</span>
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* User active status */}
        {user?.isPremium && user.premiumExpiresAt && (
          <div className="max-w-xl mx-auto p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  {language === "vi" ? "Bạn đang sở hữu PlanWise Premium" : "You have PlanWise Premium active"}
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  {t.expiresAt} <span className="text-indigo-300 font-bold">{new Date(user.premiumExpiresAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "long" })}</span>
                </p>
              </div>
            </div>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              VIP PRO
            </span>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="space-y-6 pt-6 border-t border-white/[0.05]">
          <h2 className="text-xl md:text-2xl font-bold text-center text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {t.featuresTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { text: t.featureGoal, desc: language === "vi" ? "Không lo giới hạn số lượng mục tiêu, thoải mái lập kế hoạch dài hạn." : "No limits on goal setting, design long-term plans freely." },
              { text: t.featureHabit, desc: language === "vi" ? "Tạo thói quen buổi sáng, tối và công việc mà không bị giới hạn." : "Track custom habits for routine building without constraint." },
              { text: t.featuerAIGoalPlanner, desc: language === "vi" ? "không giới hạn số lần tạo kế hoạch với AI Goal Planner." : "Unlimited planning with the AI Goal Planner." },
              { text: t.featureAIAssistant, desc: language === "vi" ? "Tương tác không giới hạn với AI Assistant." : "Unlimited interactions with the AI Assistant." },
              { text: t.featureCategories, desc: language === "vi" ? "Phân loại công việc theo danh mục riêng với màu sắc cá nhân hóa." : "Define custom categories and choose palette accents for calendar visual cues." },
              { text: t.featureEarlyAccess, desc: language === "vi" ? "Được thử nghiệm các tính năng mới trước người dùng khác." : "Early access to new features before they are released to the public." },
            ].map((f, index) => (
              <div key={index} className="p-5 rounded-2xl bg-slate-900/20 border border-white/[0.04] hover:border-indigo-500/20 transition-all flex gap-3.5">
                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-200">{f.text}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="space-y-6 pt-6 border-t border-white/[0.05]">
          <h2 className="text-xl md:text-2xl font-bold text-center text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {t.featuresComparison}
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-white/[0.05] bg-slate-900/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] bg-slate-900/30">
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t.featureName}</th>
                  <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center w-40">{t.freePlan}</th>
                  <th className="p-4 text-xs font-bold text-indigo-400 uppercase tracking-wider text-center w-48">{t.premiumPlan}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] text-sm">
                <tr>
                  <td className="p-4 font-medium text-slate-300">{language === "vi" ? "Giới hạn Mục tiêu" : "Goal Limit"}</td>
                  <td className="p-4 text-center text-slate-500">3</td>
                  <td className="p-4 text-center font-bold text-indigo-300">{t.unlimited}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-300">{language === "vi" ? "Giới hạn Thói quen" : "Habit Limit"}</td>
                  <td className="p-4 text-center text-slate-500">3</td>
                  <td className="p-4 text-center font-bold text-indigo-300">{t.unlimited}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-300">{language === "vi" ? "Giới hạn AI Goal Planner" : "AI Goal Planner Limit"}</td>
                  <td className="p-4 text-center text-slate-500">{language === "vi" ? "Giới hạn" : "Limited Context"}</td>
                  <td className="p-4 text-center font-bold text-indigo-300">{t.unlimited}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-300">{language === "vi" ? "Giới hạn Trợ lý AI" : "AI Assistant Limit"}</td>
                  <td className="p-4 text-center text-slate-500">{language === "vi" ? "Giới hạn" : "Limited Context"}</td>
                  <td className="p-4 text-center font-bold text-indigo-300">{t.unlimited}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-300">{language === "vi" ? "Danh mục tùy chỉnh" : "Personalized Categories"}</td>
                  <td className="p-4 text-center text-slate-500">{language === "vi" ? "Mặc định" : "Standard"}</td>
                  <td className="p-4 text-center font-bold text-indigo-300">{language === "vi" ? "Tự chọn màu & nhãn" : "Full custom tags & colors"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
