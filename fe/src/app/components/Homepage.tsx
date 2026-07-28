import { useNavigate } from "react-router";
import { Calendar, Target, BarChart3, ArrowRight } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden relative">
      {/* Background Blur */}
      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-[320px] w-[320px] bg-indigo-600/20 blur-[140px] sm:h-[600px] sm:w-[600px] sm:blur-[180px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] bg-violet-600/20 blur-[140px] sm:h-[600px] sm:w-[600px] sm:blur-[180px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 px-4 py-5 sm:px-8 lg:px-10">
        <h1 className="text-2xl font-black sm:text-3xl">
          Plan<span className="text-indigo-500">Wise</span>
        </h1>

        <button
          onClick={() => navigate("/login")}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition font-semibold"
        >
          Đăng nhập
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center px-4 pt-16 text-center sm:px-6 sm:pt-24">
        <div className="max-w-5xl">
          <span className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm">
            🚀 Smart Productivity Platform
          </span>

          <h1 className="mt-8 text-4xl font-black leading-tight sm:text-5xl md:text-7xl">
            Quản lý thời gian
            <br />
            <span className="text-indigo-500">
              thông minh hơn mỗi ngày
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base text-slate-400 sm:text-xl">
            Theo dõi công việc, quản lý mục tiêu, xây dựng thói quen
            và tối ưu năng suất cá nhân trên một nền tảng duy nhất.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-bold hover:bg-indigo-700 sm:px-8 sm:py-4"
            >
              Bắt đầu ngay
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="relative z-10 mt-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center sm:p-8">
            <h2 className="text-4xl font-black text-indigo-400">
              10K+
            </h2>
            <p className="text-slate-400 mt-2">
              Công việc đã hoàn thành
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center sm:p-8">
            <h2 className="text-4xl font-black text-violet-400">
              2K+
            </h2>
            <p className="text-slate-400 mt-2">
              Mục tiêu đạt được
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center sm:p-8">
            <h2 className="text-4xl font-black text-emerald-400">
              95%
            </h2>
            <p className="text-slate-400 mt-2">
              Tỷ lệ năng suất
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="mb-10 text-center text-3xl font-black sm:mb-14 sm:text-4xl">
            Tính năng nổi bật
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-indigo-500/40 sm:p-8">
              <Calendar
                className="text-indigo-400 mb-4"
                size={40}
              />

              <h3 className="font-bold text-xl mb-3">
                Quản lý lịch trình
              </h3>

              <p className="text-slate-400">
                Theo dõi công việc và lịch trình hàng ngày trực quan,
                khoa học và dễ sử dụng.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-violet-500/40 sm:p-8">
              <Target
                className="text-violet-400 mb-4"
                size={40}
              />

              <h3 className="font-bold text-xl mb-3">
                Theo dõi mục tiêu
              </h3>

              <p className="text-slate-400">
                Xây dựng kế hoạch dài hạn và theo dõi tiến độ hoàn
                thành mục tiêu.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-emerald-500/40 sm:p-8">
              <BarChart3
                className="text-emerald-400 mb-4"
                size={40}
              />

              <h3 className="font-bold text-xl mb-3">
                Báo cáo năng suất
              </h3>

              <p className="text-slate-400">
                Phân tích hiệu suất làm việc bằng biểu đồ trực quan
                và báo cáo chi tiết.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-slate-500">
        © 2026 PlanWise. All rights reserved.
      </footer>
    </div>
  );
}
