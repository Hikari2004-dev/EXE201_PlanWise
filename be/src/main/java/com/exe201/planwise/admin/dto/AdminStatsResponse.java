package com.exe201.planwise.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsResponse {
    private long totalUsers;
    private long totalPremiumUsers;
    private long totalTransactions;
    private BigDecimal totalRevenue;
    private BigDecimal monthlyRevenue;
    private List<MonthlyRevenue> revenueByMonth;
    private List<TransactionsByDay> transactionsByDay;
    private List<PlanStats> planStats;
    private List<UserGrowth> userGrowth;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyRevenue {
        private int month;
        private int year;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransactionsByDay {
        private String date;
        private long count;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanStats {
        private String planId;
        private String planName;
        private long subscriberCount;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserGrowth {
        private String date;
        private long totalUsers;
        private long newUsers;
    }
}
