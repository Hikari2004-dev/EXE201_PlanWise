package com.exe201.planwise.admin.service;

import com.exe201.planwise.admin.dto.AdminStatsResponse;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.entity.PaymentTransaction;
import com.exe201.planwise.user.repository.UserRepository;
import com.exe201.planwise.user.repository.UserSubscriptionRepository;
import com.exe201.planwise.user.repository.PaymentTransactionRepository;
import com.exe201.planwise.reflection.entity.DailyReflection;
import com.exe201.planwise.reflection.repository.DailyReflectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final DailyReflectionRepository dailyReflectionRepository;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        OffsetDateTime now = OffsetDateTime.now();

        // Total users
        long totalUsers = userRepository.count();

        // Premium users - count directly from subscriptions
        long totalPremiumUsers = userSubscriptionRepository.findAll().stream()
            .filter(sub -> "ACTIVE".equals(sub.getStatus()) && sub.getEndDate().isAfter(now))
            .count();

        // Total transactions (SUCCESS only)
        long totalTransactions = paymentTransactionRepository.findAll().stream()
            .filter(tx -> "SUCCESS".equals(tx.getStatus()))
            .count();

        // Total revenue
        BigDecimal totalRevenue = paymentTransactionRepository.findAll().stream()
            .filter(tx -> "SUCCESS".equals(tx.getStatus()))
            .map(PaymentTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Monthly revenue (current year)
        BigDecimal monthlyRevenue = paymentTransactionRepository.findAll().stream()
            .filter(tx -> "SUCCESS".equals(tx.getStatus()))
            .filter(tx -> tx.getCreatedAt().getYear() == now.getYear())
            .map(PaymentTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Revenue by month (simplified - last 12 months)
        List<AdminStatsResponse.MonthlyRevenue> revenueByMonth = getRevenueByMonth();

        // Transactions by day (last 30 days)
        List<AdminStatsResponse.TransactionsByDay> transactionsByDay = getTransactionsByDay();

        // Plan statistics
        List<AdminStatsResponse.PlanStats> planStats = getPlanStats();

        // User growth (last 30 days)
        List<AdminStatsResponse.UserGrowth> userGrowth = getUserGrowth();

        return AdminStatsResponse.builder()
            .totalUsers(totalUsers)
            .totalPremiumUsers(totalPremiumUsers)
            .totalTransactions(totalTransactions)
            .totalRevenue(totalRevenue)
            .monthlyRevenue(monthlyRevenue)
            .revenueByMonth(revenueByMonth)
            .transactionsByDay(transactionsByDay)
            .planStats(planStats)
            .userGrowth(userGrowth)
            .build();
    }

    private List<AdminStatsResponse.MonthlyRevenue> getRevenueByMonth() {
        OffsetDateTime yearAgo = OffsetDateTime.now().minusMonths(12);
        return paymentTransactionRepository.findAll().stream()
            .filter(tx -> "SUCCESS".equals(tx.getStatus()))
            .filter(tx -> tx.getCreatedAt().isAfter(yearAgo))
            .collect(Collectors.groupingBy(tx -> tx.getCreatedAt().getMonth()))
            .entrySet().stream()
            .map(entry -> AdminStatsResponse.MonthlyRevenue.builder()
                .month(entry.getKey().getValue())
                .year(OffsetDateTime.now().getYear())
                .revenue(entry.getValue().stream()
                    .map(PaymentTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add))
                .build())
            .sorted(Comparator.comparing(AdminStatsResponse.MonthlyRevenue::getMonth))
            .collect(Collectors.toList());
    }

    private List<AdminStatsResponse.TransactionsByDay> getTransactionsByDay() {
        OffsetDateTime since = OffsetDateTime.now().minusDays(30);
        return paymentTransactionRepository.findAll().stream()
            .filter(tx -> "SUCCESS".equals(tx.getStatus()))
            .filter(tx -> tx.getCreatedAt().isAfter(since))
            .collect(Collectors.groupingBy(tx -> tx.getCreatedAt().toLocalDate().toString()))
            .entrySet().stream()
            .map(entry -> AdminStatsResponse.TransactionsByDay.builder()
                .date(entry.getKey())
                .count(entry.getValue().size())
                .revenue(entry.getValue().stream()
                    .map(PaymentTransaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add))
                .build())
            .sorted(Comparator.comparing(AdminStatsResponse.TransactionsByDay::getDate))
            .collect(Collectors.toList());
    }

    private List<AdminStatsResponse.PlanStats> getPlanStats() {
        return paymentTransactionRepository.findAll().stream()
            .filter(tx -> "SUCCESS".equals(tx.getStatus()))
            .collect(Collectors.groupingBy(tx -> tx.getPlan().getId()))
            .entrySet().stream()
            .map(entry -> {
                var plan = entry.getValue().get(0).getPlan();
                return AdminStatsResponse.PlanStats.builder()
                    .planId(plan.getId().toString())
                    .planName(plan.getName())
                    .subscriberCount(entry.getValue().size())
                    .revenue(entry.getValue().stream()
                        .map(PaymentTransaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                    .build();
            })
            .collect(Collectors.toList());
    }

    private List<AdminStatsResponse.UserGrowth> getUserGrowth() {
        OffsetDateTime since = OffsetDateTime.now().minusDays(30);
        List<User> allUsers = userRepository.findAll();

        return allUsers.stream()
            .filter(u -> u.getCreatedAt().isAfter(since))
            .collect(Collectors.groupingBy(u -> u.getCreatedAt().toLocalDate().toString()))
            .entrySet().stream()
            .map(entry -> {
                String date = entry.getKey();
                long newUsers = entry.getValue().size();
                long totalUsers = allUsers.stream()
                    .filter(u -> !u.getCreatedAt().isAfter(entry.getValue().get(0).getCreatedAt()))
                    .count();
                return AdminStatsResponse.UserGrowth.builder()
                    .date(date)
                    .totalUsers(totalUsers)
                    .newUsers(newUsers)
                    .build();
            })
            .sorted(Comparator.comparing(AdminStatsResponse.UserGrowth::getDate))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentTransactions(int limit) {
        return paymentTransactionRepository.findAll().stream()
            .filter(tx -> "SUCCESS".equals(tx.getStatus()))
            .sorted(Comparator.comparing(PaymentTransaction::getCreatedAt).reversed())
            .limit(limit)
            .map(tx -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", tx.getId());
                map.put("orderId", tx.getOrderId());
                map.put("userEmail", tx.getUser().getEmail());
                map.put("userName", tx.getUser().getFullName());
                map.put("planName", tx.getPlan().getName());
                map.put("amount", tx.getAmount());
                map.put("status", tx.getStatus());
                map.put("createdAt", tx.getCreatedAt());
                return map;
            })
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream()
            .map(user -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", user.getId());
                map.put("email", user.getEmail());
                map.put("fullName", user.getFullName());
                map.put("role", user.getRole().name());
                map.put("isPremium", user.isPremium());
                map.put("createdAt", user.getCreatedAt());
                map.put("lastLoginAt", user.getLastLoginAt());
                return map;
            })
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserReflections(int limit) {
        return dailyReflectionRepository.findAll().stream()
            .sorted(Comparator.comparing(DailyReflection::getReflectionDate).reversed())
            .limit(limit)
            .map(r -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", r.getId());
                map.put("userEmail", r.getUser() != null ? r.getUser().getEmail() : "N/A");
                map.put("userName", r.getUser() != null ? r.getUser().getFullName() : "N/A");
                map.put("reflectionDate", r.getReflectionDate());
                map.put("completed", r.getCompleted());
                map.put("obstacles", r.getObstacles());
                map.put("improvements", r.getImprovements());
                map.put("energyLevel", r.getEnergyLevel());
                map.put("mood", r.getMood() != null ? r.getMood().name() : "okay");
                map.put("createdAt", r.getCreatedAt());
                return map;
            })
            .collect(Collectors.toList());
    }
}
