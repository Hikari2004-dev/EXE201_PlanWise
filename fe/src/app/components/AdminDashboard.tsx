import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  CreditCard,
  TrendingUp,
  Crown,
  BarChart3,
  Activity,
  DollarSign,
  Package,
  RefreshCw,
  CheckCircle,
  UserPlus,
  Clock,
  XCircle,
  Search,
  Filter,
  Star,
  MessageSquare,
  Smile,
  Meh,
  Frown,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AdminStats {
  totalUsers: number;
  totalPremiumUsers: number;
  totalTransactions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueByMonth: Array<{ month: number; year: number; revenue: number }>;
  transactionsByDay: Array<{ date: string; count: number; revenue: number }>;
  planStats: Array<{ planId: string; planName: string; subscriberCount: number; revenue: number }>;
  userGrowth: Array<{ date: string; totalUsers: number; newUsers: number }>;
}

interface TransactionDetail {
  id: string;
  orderId: string;
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface UserReview {
  id: string;
  userName: string;
  userEmail: string;
  reflectionDate: string;
  mood?: string;
  energyLevel?: number;
  rating?: number;
  completed?: string;
  obstacles?: string;
  improvements?: string;
  comment?: string;
  createdAt?: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

type TabType = "overview" | "revenue" | "users" | "plans" | "reviews";



export function AdminDashboard() {
  const { fetchWithAuth, user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionDetail[]>([]);
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewMoodFilter, setReviewMoodFilter] = useState("all");

  const fetchStats = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetchWithAuth("/api/v1/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 403) {
        setError("Bạn không có quyền truy cập Admin Dashboard");
      } else if (response.status === 500) {
        setError("Lỗi server. Vui lòng thử lại sau.");
      } else {
        setError("Không thể tải dữ liệu");
      }

      // Fetch recent transactions
      try {
        const txRes = await fetchWithAuth("/api/v1/admin/transactions/recent?limit=50");
        if (txRes.ok) {
          const txData = await txRes.json();
          if (Array.isArray(txData) && txData.length > 0) {
            setRecentTransactions(txData);
          } else {
            setRecentTransactions(MOCK_RECENT_TRANSACTIONS);
          }
        } else {
          setRecentTransactions(MOCK_RECENT_TRANSACTIONS);
        }
      } catch {
        setRecentTransactions(MOCK_RECENT_TRANSACTIONS);
      }

      // Fetch user reviews/reflections
      try {
        const revRes = await fetchWithAuth("/api/v1/admin/reflections?limit=50");
        if (revRes.ok) {
          const revData = await revRes.json();
          setUserReviews(Array.isArray(revData) ? revData : []);
        }
      } catch {
        // silently fail, userReviews remains []
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  const formatMonth = (month: number) => {
    const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
    return months[month - 1] || `T${month}`;
  };

  const revenueChartData = stats?.revenueByMonth
    ? [...stats.revenueByMonth]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .slice(-6)
      .map((item) => ({
        name: formatMonth(item.month),
        revenue: item.revenue / 1000000,
      }))
    : [];

  const transactionsChartData = stats?.transactionsByDay
    ? [...stats.transactionsByDay]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((item) => ({
        name: item.date.slice(5),
        transactions: item.count,
      }))
    : [];

  const userGrowthChartData = stats?.userGrowth
    ? [...stats.userGrowth]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((item) => ({
        name: item.date.slice(5),
        total: item.totalUsers,
        new: item.newUsers,
      }))
    : [];

  const planChartData =
    stats?.planStats.map((item, index) => ({
      name: item.planName,
      value: item.subscriberCount,
      color: COLORS[index % COLORS.length],
    })) || [];

  const premiumRate = stats && stats.totalUsers > 0
    ? ((stats.totalPremiumUsers / stats.totalUsers) * 100).toFixed(1)
    : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <XCircle size={32} className="text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{error}</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {error.includes("quyền")
            ? "Bạn cần đăng nhập với tài khoản Admin để truy cập."
            : "Vui lòng thử tải lại trang hoặc liên hệ hỗ trợ."}
        </p>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          Thử lại
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BarChart3 size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có dữ liệu thống kê</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Dữ liệu admin hiện chưa sẵn sàng. Vui lòng thử tải lại.
        </p>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl transition-colors"
        >
          <RefreshCw size={18} />
          Tải lại
        </button>
      </div>
    );
  }

  const totalRevenue = stats.totalRevenue || 0;
  const monthlyRev = stats?.monthlyRevenue || 0;

  const filteredTransactions = recentTransactions.filter((tx) => {
    const matchesSearch =
      (tx.orderId || "").toLowerCase().includes(txSearch.toLowerCase()) ||
      (tx.userEmail || "").toLowerCase().includes(txSearch.toLowerCase()) ||
      (tx.userName || "").toLowerCase().includes(txSearch.toLowerCase());
    const matchesStatus =
      txStatusFilter === "all" || tx.status.toUpperCase() === txStatusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  const filteredReviews = userReviews.filter((rev) => {
    const matchesSearch =
      (rev.userName || "").toLowerCase().includes(reviewSearch.toLowerCase()) ||
      (rev.userEmail || "").toLowerCase().includes(reviewSearch.toLowerCase()) ||
      (rev.completed || "").toLowerCase().includes(reviewSearch.toLowerCase()) ||
      (rev.improvements || "").toLowerCase().includes(reviewSearch.toLowerCase()) ||
      (rev.comment || "").toLowerCase().includes(reviewSearch.toLowerCase());
    const matchesMood =
      reviewMoodFilter === "all" || (rev.mood || "").toLowerCase() === reviewMoodFilter.toLowerCase();
    return matchesSearch && matchesMood;
  });

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Chào mừng {user?.fullName || user?.email} • {new Date().toLocaleDateString("vi-VN", { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Tổng quan", icon: BarChart3 },
          { id: "revenue", label: "Doanh thu", icon: DollarSign },
          { id: "users", label: "Người dùng", icon: Users },
          { id: "plans", label: "Gói Premium", icon: Package },
          { id: "reviews", label: "Đánh giá người dùng", icon: Star },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Users size={24} />}
              label="Tổng người dùng"
              value={formatNumber(stats.totalUsers)}
              trend={stats.userGrowth.reduce((sum, g) => sum + g.newUsers, 0)}
              trendLabel="tuần này"
              iconBgClass="bg-blue-500/10 dark:bg-blue-500/20"
              iconTextClass="text-blue-500 dark:text-blue-400"
            />
            <StatCard
              icon={<Crown size={24} />}
              label="Premium"
              value={formatNumber(stats.totalPremiumUsers)}
              subValue={`${premiumRate}% người dùng`}
              iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
              iconTextClass="text-amber-500 dark:text-amber-400"
            />
            <StatCard
              icon={<CreditCard size={24} />}
              label="Giao dịch"
              value={formatNumber(stats.totalTransactions)}
              subValue="thành công"
              iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
              iconTextClass="text-emerald-500 dark:text-emerald-400"
            />
            <StatCard
              icon={<TrendingUp size={24} />}
              label="Doanh thu"
              value={formatCurrency(totalRevenue)}
              trend={monthlyRev}
              trendLabel="tháng này"
              iconBgClass="bg-violet-500/10 dark:bg-violet-500/20"
              iconTextClass="text-violet-500 dark:text-violet-400"
            />
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickStatCard
              icon={<UserPlus size={20} />}
              iconBgClass="bg-indigo-500/10 dark:bg-indigo-500/20"
              iconTextClass="text-indigo-500 dark:text-indigo-400"
              label="Người dùng mới"
              value={stats.userGrowth.length}
              subText="trong 30 ngày qua"
            />
            <QuickStatCard
              icon={<CheckCircle size={20} />}
              iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
              iconTextClass="text-emerald-500 dark:text-emerald-400"
              label="Tỷ lệ Premium"
              value={`${premiumRate}%`}
              subText="tổng người dùng"
            />
            <QuickStatCard
              icon={<Clock size={20} />}
              iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
              iconTextClass="text-amber-500 dark:text-amber-400"
              label="Doanh thu tháng"
              value={formatCurrency(monthlyRev)}
              subText="tháng hiện tại"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <ChartCard
              title="Doanh thu 6 tháng gần nhất"
              icon={<DollarSign size={20} />}
              iconClass="text-emerald-500 dark:text-emerald-400"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" className="dark:opacity-30" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `${v}M`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}M VNĐ`, "Doanh thu"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* User Growth */}
            <ChartCard
              title="Tăng trưởng người dùng"
              icon={<Activity size={20} />}
              iconClass="text-indigo-500 dark:text-indigo-400"
            >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowthChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" className="dark:opacity-30" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        color: "var(--foreground)",
                      }}
                    />
                    <Bar dataKey="new" fill="#6366f1" radius={[4, 4, 0, 0]} name="Người dùng mới" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RevenueStatCard
              label="Tổng doanh thu"
              value={formatCurrency(totalRevenue)}
              bgClass="from-emerald-500/10 to-transparent dark:from-emerald-500/20"
              borderClass="border-emerald-500/20 dark:border-emerald-500/30"
              textClass="text-emerald-600 dark:text-emerald-400"
            />
            <RevenueStatCard
              label="Doanh thu tháng này"
              value={formatCurrency(monthlyRev)}
              bgClass="from-blue-500/10 to-transparent dark:from-blue-500/20"
              borderClass="border-blue-500/20 dark:border-blue-500/30"
              textClass="text-blue-600 dark:text-blue-400"
            />
            <RevenueStatCard
              label="Số giao dịch"
              value={formatNumber(stats.totalTransactions)}
              bgClass="from-violet-500/10 to-transparent dark:from-violet-500/20"
              borderClass="border-violet-500/20 dark:border-violet-500/30"
              textClass="text-violet-600 dark:text-violet-400"
            />
          </div>

          <ChartCard
            title="Giao dịch theo ngày (14 ngày gần nhất)"
            icon={<CreditCard size={20} />}
            iconClass="text-amber-500 dark:text-amber-400"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" className="dark:opacity-30" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Số giao dịch" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Detailed Transactions Table */}
          <ChartCard
            title="Chi tiết danh sách giao dịch"
            icon={<CreditCard size={20} />}
            iconClass="text-emerald-500 dark:text-emerald-400"
          >
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="relative w-full sm:w-72">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, email, tên..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={16} className="text-muted-foreground" />
                <select
                  value={txStatusFilter}
                  onChange={(e) => setTxStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="SUCCESS">Thành công</option>
                  <option value="PENDING">Đang xử lý</option>
                  <option value="FAILED">Thất bại</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Mã giao dịch</th>
                    <th className="px-4 py-3 font-semibold">Khách hàng</th>
                    <th className="px-4 py-3 font-semibold">Gói đăng ký</th>
                    <th className="px-4 py-3 font-semibold">Số tiền</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <tr key={tx.id || tx.orderId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-foreground">
                          {tx.orderId || tx.id?.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{tx.userName || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{tx.userEmail}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {tx.planName || "Premium"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(tx.amount || 0)}
                        </td>
                        <td className="px-4 py-3">
                          {tx.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle size={12} /> Thành công
                            </span>
                          ) : tx.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <Clock size={12} /> Đang xử lý
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                              <XCircle size={12} /> Thất bại
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Không tìm thấy giao dịch phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <RevenueStatCard
              label="Tổng người dùng"
              value={formatNumber(stats.totalUsers)}
              bgClass="from-blue-500/10 to-transparent dark:from-blue-500/20"
              borderClass="border-blue-500/20 dark:border-blue-500/30"
              textClass="text-blue-600 dark:text-blue-400"
            />
            <RevenueStatCard
              label="Premium"
              value={formatNumber(stats.totalPremiumUsers)}
              bgClass="from-amber-500/10 to-transparent dark:from-amber-500/20"
              borderClass="border-amber-500/20 dark:border-amber-500/30"
              textClass="text-amber-600 dark:text-amber-400"
            />
            <RevenueStatCard
              label="Miễn phí"
              value={formatNumber(stats.totalUsers - stats.totalPremiumUsers)}
              bgClass="from-emerald-500/10 to-transparent dark:from-emerald-500/20"
              borderClass="border-emerald-500/20 dark:border-emerald-500/30"
              textClass="text-emerald-600 dark:text-emerald-400"
            />
            <RevenueStatCard
              label="Tỷ lệ Premium"
              value={`${premiumRate}%`}
              bgClass="from-violet-500/10 to-transparent dark:from-violet-500/20"
              borderClass="border-violet-500/20 dark:border-violet-500/30"
              textClass="text-violet-600 dark:text-violet-400"
            />
          </div>

          <ChartCard
            title="Tăng trưởng người dùng (14 ngày)"
            icon={<Users size={20} />}
            iconClass="text-emerald-500 dark:text-emerald-400"
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" className="dark:opacity-30" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--foreground)",
                    }}
                  />
                  <Bar dataKey="new" fill="#10b981" radius={[4, 4, 0, 0]} name="Người dùng mới" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          {planChartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Phân bố gói Premium"
                icon={<Package size={20} />}
                iconClass="text-violet-500 dark:text-violet-400"
              >
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {planChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          color: "var(--foreground)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {planChartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 dark:bg-muted rounded-xl">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <div>
                        <p className="text-foreground font-medium text-sm">{item.name}</p>
                        <p className="text-muted-foreground text-xs">{item.value} người dùng</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard
                title="Chi tiết theo gói"
                icon={<Crown size={20} />}
                iconClass="text-amber-500 dark:text-amber-400"
              >
                <div className="space-y-4">
                  {stats.planStats.map((plan, index) => (
                    <div key={plan.planId} className="p-4 bg-muted/50 dark:bg-muted rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-foreground font-medium">{plan.planName}</span>
                        </div>
                        <span className="text-primary font-bold">{plan.subscriberCount} người</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Doanh thu</span>
                        <span className="text-emerald-500 dark:text-emerald-400 font-medium">{formatCurrency(plan.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          ) : (
            <ChartCard
              title="Phân bố gói Premium"
              icon={<Package size={20} />}
              iconClass="text-muted-foreground"
            >
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Package size={48} className="text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Chưa có dữ liệu gói Premium</p>
              </div>
            </ChartCard>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (() => {
        const reviewsWithEnergy = userReviews.filter((r) => r.energyLevel != null && r.energyLevel > 0);
        const avgEnergy = reviewsWithEnergy.length > 0
          ? (reviewsWithEnergy.reduce((sum, r) => sum + (r.energyLevel || 0), 0) / reviewsWithEnergy.length).toFixed(1)
          : "0";
        const happyCount = userReviews.filter((r) => r.mood === "great" || r.mood === "good").length;
        const satisfactionRate = userReviews.length > 0
          ? Math.round((happyCount / userReviews.length) * 100)
          : 0;
        const moodCounts: Record<string, number> = {};
        userReviews.forEach((r) => {
          const m = r.mood || "okay";
          moodCounts[m] = (moodCounts[m] || 0) + 1;
        });
        const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
        const topMoodLabel = topMood ? (topMood[0] === "great" ? "Tuyệt vời" : topMood[0] === "good" ? "Tốt" : topMood[0] === "okay" ? "Bình thường" : "Cần cố gắng") : "N/A";

        return (
          <div className="space-y-6">
            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Star size={24} />}
                label="Tâm trạng phổ biến"
                value={topMoodLabel}
                subValue={topMood ? `${topMood[1]} lượt ghi nhận` : "Chưa có dữ liệu"}
                iconBgClass="bg-amber-500/10 dark:bg-amber-500/20"
                iconTextClass="text-amber-500 dark:text-amber-400"
              />
              <StatCard
                icon={<Zap size={24} />}
                label="Mức năng lượng TB"
                value={`${avgEnergy} / 10`}
                subValue={`Dựa trên ${reviewsWithEnergy.length} lượt đánh giá`}
                iconBgClass="bg-indigo-500/10 dark:bg-indigo-500/20"
                iconTextClass="text-indigo-500 dark:text-indigo-400"
              />
              <StatCard
                icon={<Smile size={24} />}
                label="Tỷ lệ hài lòng"
                value={`${satisfactionRate}%`}
                subValue="Tâm trạng Tốt & Tuyệt vời"
                iconBgClass="bg-emerald-500/10 dark:bg-emerald-500/20"
                iconTextClass="text-emerald-500 dark:text-emerald-400"
              />
              <StatCard
                icon={<MessageSquare size={24} />}
                label="Tổng số phản hồi"
                value={formatNumber(userReviews.length)}
                subValue="Nhật ký & Đánh giá"
                iconBgClass="bg-violet-500/10 dark:bg-violet-500/20"
                iconTextClass="text-violet-500 dark:text-violet-400"
              />
            </div>

            {/* Search & Filter & Reviews Grid */}
            <ChartCard
              title="Danh sách đánh giá & phản hồi từ người dùng"
              icon={<MessageSquare size={20} />}
              iconClass="text-violet-500 dark:text-violet-400"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full sm:w-80">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, email, nhận xét..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter size={16} className="text-muted-foreground" />
                  <select
                    value={reviewMoodFilter}
                    onChange={(e) => setReviewMoodFilter(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Tất cả tâm trạng</option>
                    <option value="great">Tuyệt vời 😁</option>
                    <option value="good">Tốt 🙂</option>
                    <option value="okay">Bình thường 😐</option>
                    <option value="bad">Cần cố gắng 🙁</option>
                  </select>
                </div>
              </div>

              {/* Reviews Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReviews.length > 0 ? (
                  filteredReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 bg-card/60 border border-border rounded-xl hover:border-primary/30 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                            {(rev.userName || rev.userEmail || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{rev.userName || "Người dùng"}</p>
                            <p className="text-xs text-muted-foreground">{rev.userEmail}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {rev.reflectionDate || "Gần đây"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Mood Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${rev.mood === "great"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : rev.mood === "good"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : rev.mood === "okay"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}
                        >
                          {rev.mood === "great" && <Smile size={14} />}
                          {rev.mood === "good" && <Smile size={14} />}
                          {rev.mood === "okay" && <Meh size={14} />}
                          {rev.mood === "bad" && <Frown size={14} />}
                          {rev.mood === "great" ? "Tuyệt vời" : rev.mood === "good" ? "Tốt" : rev.mood === "okay" ? "Bình thường" : "Cần cố gắng"}
                        </span>

                        {/* Energy Level */}
                        {rev.energyLevel !== undefined && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Zap size={14} className="text-amber-500" />
                            <span>Năng lượng: <strong className="text-foreground">{rev.energyLevel}/10</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Content Details */}
                      <div className="space-y-2 text-xs pt-1 border-t border-border/50">
                        {rev.completed && (
                          <div>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ Đã hoàn thành: </span>
                            <span className="text-foreground/90">{rev.completed}</span>
                          </div>
                        )}
                        {rev.obstacles && (
                          <div>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">⚠ Khó khăn / Trì hoãn: </span>
                            <span className="text-foreground/90">{rev.obstacles}</span>
                          </div>
                        )}
                        {rev.improvements && (
                          <div>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">💡 Hành động cải thiện: </span>
                            <span className="text-foreground/90">{rev.improvements}</span>
                          </div>
                        )}
                        {rev.comment && (
                          <div className="italic bg-muted/40 p-2.5 rounded-lg text-foreground/80 mt-2">
                            "{rev.comment}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-muted-foreground">
                    <MessageSquare size={36} className="mx-auto mb-2 opacity-50" />
                    Không tìm thấy nhận xét phù hợp
                  </div>
                )}
              </div>
            </ChartCard>
          </div>
        );
      })()}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  subValue,
  iconBgClass,
  iconTextClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  subValue?: string;
  iconBgClass: string;
  iconTextClass: string;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border dark:border-border hover:border-primary/20 dark:hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${iconBgClass} ${iconTextClass}`}>{icon}</div>
        {trend !== undefined && trend > 0 && (
          <span className="text-emerald-500 dark:text-emerald-400 text-sm font-medium flex items-center gap-1">
            <TrendingUp size={14} />
            +{trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
        {(subValue || trendLabel) && (
          <p className="text-muted-foreground/70 text-xs mt-1">{subValue || trendLabel}</p>
        )}
      </div>
    </div>
  );
}

function QuickStatCard({
  icon,
  label,
  value,
  subText,
  iconBgClass,
  iconTextClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subText: string;
  iconBgClass: string;
  iconTextClass: string;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border dark:border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${iconBgClass} ${iconTextClass} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
      <p className="text-muted-foreground/70 text-sm">{subText}</p>
    </div>
  );
}

function ChartCard({
  title,
  icon,
  iconClass,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl p-6 border border-border dark:border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className={iconClass}>{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function RevenueStatCard({
  label,
  value,
  bgClass,
  borderClass,
  textClass,
}: {
  label: string;
  value: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${bgClass} rounded-2xl p-6 border ${borderClass}`}>
      <p className={`${textClass} text-sm font-medium mb-2`}>{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
