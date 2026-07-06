package com.exe201.planwise.subscription.service;

import com.exe201.planwise.config.AppProperties;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.PaymentTransaction;
import com.exe201.planwise.user.entity.SubscriptionPlan;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.entity.UserSubscription;
import com.exe201.planwise.user.repository.PaymentTransactionRepository;
import com.exe201.planwise.user.repository.SubscriptionPlanRepository;
import com.exe201.planwise.user.repository.UserRepository;
import com.exe201.planwise.user.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLink;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayosPaymentService {

    private final PayOS payOS;
    private final AppProperties appProperties;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    @Transactional
    public Map<String, String> createPayment(UUID userId, UUID planId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new AppException(ErrorCode.PLAN_NOT_FOUND, "Không tìm thấy gói đăng ký"));

        long orderCode = System.currentTimeMillis() / 1000;
        long amount = plan.getPrice().longValue();
        String orderId = String.valueOf(orderCode);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .user(user)
                .plan(plan)
                .orderId(orderId)
                .requestId(orderId)
                .amount(plan.getPrice())
                .paymentMethod("PAYOS")
                .status("PENDING")
                .build();
        paymentTransactionRepository.save(transaction);

        try {
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name(buildItemName(plan.getName()))
                    .quantity(1)
                    .price(amount)
                    .build();

            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(amount)
                    .description(buildDescription(plan.getDurationMonths()))
                    .returnUrl(appProperties.getPayos().getReturnUrl())
                    .cancelUrl(appProperties.getPayos().getCancelUrl())
                    .item(item)
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);
            transaction.setRequestId(response.getPaymentLinkId() != null ? response.getPaymentLinkId() : orderId);
            paymentTransactionRepository.save(transaction);

            return Map.of(
                    "payUrl", response.getCheckoutUrl(),
                    "checkoutUrl", response.getCheckoutUrl(),
                    "orderId", orderId);
        } catch (Exception ex) {
            transaction.setStatus("FAILED");
            transaction.setRawCallbackResponse(ex.getMessage());
            paymentTransactionRepository.save(transaction);
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Không thể tạo liên kết thanh toán PayOS: " + ex.getMessage());
        }
    }

    @Transactional
    public void processWebhook(Object body) {
        try {
            WebhookData data = payOS.webhooks().verify(body);
            String orderId = String.valueOf(data.getOrderCode());
            PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                            "Không tìm thấy giao dịch: " + orderId));

            transaction.setRawCallbackResponse(String.valueOf(body));
            if (data.getReference() != null && !data.getReference().isBlank()) {
                transaction.setTransId(data.getReference());
            }
            paymentTransactionRepository.save(transaction);

            syncTransactionStatus(orderId);
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(ErrorCode.BAD_REQUEST,
                    "Webhook PayOS không hợp lệ: " + ex.getMessage());
        }
    }

    @Transactional
    public PaymentTransaction getTransactionStatus(String orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                        "Không tìm thấy giao dịch: " + orderId));

        if (!"SUCCESS".equals(transaction.getStatus())) {
            syncTransactionStatus(orderId);
            transaction = paymentTransactionRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                            "Không tìm thấy giao dịch: " + orderId));
        }

        return transaction;
    }

    @Transactional
    public void mockConfirmPayment(String orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                        "Không tìm thấy giao dịch: " + orderId));

        if ("SUCCESS".equals(transaction.getStatus())) {
            return;
        }

        transaction.setStatus("SUCCESS");
        transaction.setTransId("MOCK_PAYOS_" + System.currentTimeMillis());
        paymentTransactionRepository.save(transaction);
        activateUserSubscription(transaction.getUser(), transaction.getPlan());
    }

    @Transactional
    public String syncTransactionStatus(String orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                        "Không tìm thấy giao dịch: " + orderId));

        if ("SUCCESS".equals(transaction.getStatus())) {
            return transaction.getStatus();
        }

        try {
            PaymentLink paymentLink = payOS.paymentRequests().get(Long.parseLong(orderId));
            applyProviderState(transaction, paymentLink);
        } catch (NumberFormatException ex) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Mã đơn hàng PayOS không hợp lệ: " + orderId);
        } catch (Exception ex) {
            log.warn("Không thể đồng bộ trạng thái PayOS cho order {}: {}", orderId, ex.getMessage());
        }

        return transaction.getStatus();
    }

    private void applyProviderState(PaymentTransaction transaction, PaymentLink paymentLink) {
        transaction.setRawCallbackResponse(String.valueOf(paymentLink));
        if (paymentLink.getId() != null && !paymentLink.getId().isBlank()) {
            transaction.setTransId(paymentLink.getId());
        }

        PaymentLinkStatus providerStatus = paymentLink.getStatus();
        if (providerStatus == PaymentLinkStatus.PAID) {
            if (!"SUCCESS".equals(transaction.getStatus())) {
                transaction.setStatus("SUCCESS");
                paymentTransactionRepository.save(transaction);
                activateUserSubscription(transaction.getUser(), transaction.getPlan());
            }
            return;
        }

        if (providerStatus == PaymentLinkStatus.CANCELLED
                || providerStatus == PaymentLinkStatus.EXPIRED
                || providerStatus == PaymentLinkStatus.FAILED) {
            transaction.setStatus("FAILED");
        } else {
            transaction.setStatus("PENDING");
        }

        paymentTransactionRepository.save(transaction);
    }

    private void activateUserSubscription(User user, SubscriptionPlan plan) {
        OffsetDateTime now = OffsetDateTime.now();

        Optional<UserSubscription> activeSubOpt = userSubscriptionRepository.findActiveSubscription(user.getId(), now);

        UserSubscription subscription;
        if (activeSubOpt.isPresent()) {
            subscription = activeSubOpt.get();
            subscription.setEndDate(subscription.getEndDate().plusMonths(plan.getDurationMonths()));
            subscription.setPlan(plan);
            subscription.setStatus("ACTIVE");
        } else {
            subscription = UserSubscription.builder()
                    .user(user)
                    .plan(plan)
                    .startDate(now)
                    .endDate(now.plusMonths(plan.getDurationMonths()))
                    .status("ACTIVE")
                    .build();
        }

        userSubscriptionRepository.save(subscription);
    }

    private String buildItemName(String planName) {
        if (planName == null || planName.isBlank()) {
            return "PlanWise Premium";
        }
        return planName.length() <= 25 ? planName : planName.substring(0, 25);
    }

    private String buildDescription(int durationMonths) {
        String description = "PlanWise " + durationMonths + "M";
        return description.length() <= 25 ? description : description.substring(0, 25);
    }
}
