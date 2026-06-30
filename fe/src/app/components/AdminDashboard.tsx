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

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

type TabType = "overview" | "revenue" | "users" | "plans";

export function AdminDashboard() {
  const { fetchWithAuth, user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .slice(-6)
    .map((item) => ({
      name: formatMonth(item.month),
      revenue: item.revenue / 1000000,
    })) || [];

  const transactionsChartData = stats?.transactionsByDay
    .slice(0, 14)
    .reverse()
    .map((item) => ({
      name: item.date.slice(5),
      transactions: item.count,
    })) || [];

  const userGrowthChartData = stats?.userGrowth
    .slice(0, 14)
    .reverse()
    .map((item) => ({
      name: item.date.slice(5),
      total: item.totalUsers,
      new: item.newUsers,
    })) || [];

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
      <div className="flex flex-col items-center justify-center h-96 p-8">
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

  const totalRevenue = stats?.totalRevenue || 0;
  const monthlyRev = stats?.monthlyRevenue || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
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
                <div className="grid grid-cols-2 gap-3 mt-4">
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
