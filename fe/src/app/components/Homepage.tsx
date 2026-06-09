import { useNavigate } from "react-router";
import { Calendar, Target, BarChart3, ArrowRight } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden relative">
      {/* Background Blur */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/20 blur-[180px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-600/20 blur-[180px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-10 py-6 border-b border-white/10">
        <h1 className="text-3xl font-black">
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
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24">
        <div className="max-w-5xl">
          <span className="px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm">
            🚀 Smart Productivity Platform
          </span>

          <h1 className="mt-8 text-6xl md:text-7xl font-black leading-tight">
            Quản lý thời gian
            <br />
            <span className="text-indigo-500">
              thông minh hơn mỗi ngày
            </span>
          </h1>

          <p className="mt-6 text-xl text-slate-400 max-w-3xl mx-auto">
            Theo dõi công việc, quản lý mục tiêu, xây dựng thói quen
            và tối ưu năng suất cá nhân trên một nền tảng duy nhất.
          </p>

          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold flex items-center gap-2"
            >
              Bắt đầu ngay
              <ArrowRight size={18} />
            </button>

            <button
              className="px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/5 font-bold"
            >
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="relative z-10 mt-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <h2 className="text-4xl font-black text-indigo-400">
              10K+
            </h2>
            <p className="text-slate-400 mt-2">
              Công việc đã hoàn thành
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
            <h2 className="text-4xl font-black text-violet-400">
              2K+
            </h2>
            <p className="text-slate-400 mt-2">
              Mục tiêu đạt được
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
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
          <h2 className="text-center text-4xl font-black mb-14">
            Tính năng nổi bật
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-indigo-500/40 transition">
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

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-violet-500/40 transition">
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

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-emerald-500/40 transition">
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