package com.exe201.planwise.subscription.service;

import com.exe201.planwise.config.AppProperties;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.subscription.dto.MomoIPNRequest;
import com.exe201.planwise.subscription.dto.MomoPaymentRequest;
import com.exe201.planwise.subscription.dto.MomoPaymentResponse;
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
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class MomoPaymentService {

    private final AppProperties appProperties;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Tạo URL thanh toán qua Momo Sandbox.
     */
    @Transactional
    public MomoPaymentResponse createPayment(UUID userId, UUID planId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new AppException(ErrorCode.PLAN_NOT_FOUND, "Không tìm thấy gói đăng ký"));

        AppProperties.Momo momoConfig = appProperties.getMomo();

        String orderId = "PLANWISE_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
        String requestId = UUID.randomUUID().toString();
        String orderInfo = "Nang cap Premium PlanWise";
        String extraData = "";
        long amount = plan.getPrice().longValue();

        // 1. Tạo chữ ký số
        // Format:
        // accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=captureWallet
        String rawSignature = "accessKey=" + momoConfig.getAccessKey() +
                "&amount=" + amount +
                "&extraData=" + extraData +
                "&ipnUrl=" + momoConfig.getIpnUrl() +
                "&orderId=" + orderId +
                "&orderInfo=" + orderInfo +
                "&partnerCode=" + momoConfig.getPartnerCode() +
                "&redirectUrl=" + momoConfig.getRedirectUrl() +
                "&requestId=" + requestId +
                "&requestType=captureWallet";

        log.info("MOMO PartnerCode: {}", momoConfig.getPartnerCode());
        log.info("MOMO AccessKey: {}", momoConfig.getAccessKey());
        log.info("MOMO ApiUrl: {}", momoConfig.getApiUrl());
        log.info("MOMO RedirectUrl: {}", momoConfig.getRedirectUrl());
        log.info("MOMO IpnUrl: {}", momoConfig.getIpnUrl());
        log.info("MOMO RawSignature: {}", rawSignature);

        String signature = signHmacSHA256(rawSignature, momoConfig.getSecretKey());

        log.info("MOMO Signature: {}", signature);

        // 2. Build Request Body
        MomoPaymentRequest request = MomoPaymentRequest.builder()
                .partnerCode(momoConfig.getPartnerCode())
                .requestId(requestId)
                .amount(amount)
                .orderId(orderId)
                .orderInfo(orderInfo)
                .redirectUrl(momoConfig.getRedirectUrl())
                .ipnUrl(momoConfig.getIpnUrl())
                .requestType("captureWallet")
                .extraData(extraData)
                .signature(signature)
                .lang("vi")
                .build();

        // 3. Gọi API Momo Sandbox
        try {
            log.info("Sending payment request to Momo for order: {}", orderId);
            MomoPaymentResponse response = restTemplate.postForObject(momoConfig.getApiUrl(), request,
                    MomoPaymentResponse.class);

            if (response == null || response.getResultCode() != 0) {
                String errorMsg = response != null ? response.getMessage() : "Momo API returned empty response";
                log.error("Momo payment creation failed: {}", errorMsg);
                throw new AppException(ErrorCode.MOMO_PAYMENT_FAILED, errorMsg);
            }

            // 4. Lưu giao dịch PENDING vào DB
            PaymentTransaction transaction = PaymentTransaction.builder()
                    .user(user)
                    .plan(plan)
                    .orderId(orderId)
                    .requestId(requestId)
                    .amount(plan.getPrice())
                    .paymentMethod("MOMO")
                    .status("PENDING")
                    .build();
            paymentTransactionRepository.save(transaction);

            return response;

        } catch (Exception e) {
            log.error("Error calling Momo Payment API", e);
            throw new AppException(
                    ErrorCode.MOMO_PAYMENT_FAILED,
                    "Lỗi kết nối tới cổng thanh toán Momo: " + e.getMessage());
        }
    }

    /**
     * Xử lý tín hiệu IPN (Webhook) / Callback chuyển hướng từ Momo.
     */
    @Transactional
    public void processPaymentCallback(MomoIPNRequest ipn) {
        log.info("Processing Momo Callback for order: {}, ResultCode: {}", ipn.getOrderId(), ipn.getResultCode());

        // 1. Kiểm tra chữ ký số từ phản hồi Momo để tránh giả mạo
        if (!validateMomoSignature(ipn)) {
            log.error("Invalid Momo IPN signature for order: {}", ipn.getOrderId());
            throw new AppException(ErrorCode.MOMO_SIGNATURE_INVALID, "Chữ ký phản hồi Momo không hợp lệ");
        }

        // 2. Tìm Transaction
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(ipn.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                        "Không tìm thấy giao dịch: " + ipn.getOrderId()));

        // Nếu giao dịch đã hoàn thành trước đó (đã SUCCESS hoặc FAILED) thì bỏ qua
        if (!"PENDING".equals(transaction.getStatus())) {
            log.info("Transaction {} already processed with status: {}", transaction.getOrderId(),
                    transaction.getStatus());
            return;
        }

        transaction.setTransId(String.valueOf(ipn.getTransId()));
        transaction.setRawCallbackResponse(ipn.toString());

        if (ipn.getResultCode() == 0) {
            // Thanh toán thành công!
            transaction.setStatus("SUCCESS");
            paymentTransactionRepository.save(transaction);

            // Kích hoạt/Gia hạn gói Premium
            activateUserSubscription(transaction.getUser(), transaction.getPlan());
            log.info("Successfully activated Premium for user: {} with plan: {}", transaction.getUser().getEmail(),
                    transaction.getPlan().getName());
        } else {
            // Thanh toán thất bại hoặc bị hủy
            transaction.setStatus("FAILED");
            paymentTransactionRepository.save(transaction);
            log.warn("Payment failed for order: {}, message: {}", ipn.getOrderId(), ipn.getMessage());
        }
    }

    /**
     * Giả lập IPN Webhook (Dành cho kiểm thử cục bộ không cần ngrok public).
     */
    @Transactional
    public void mockIpnCallback(String orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                        "Không tìm thấy giao dịch: " + orderId));

        if (!"PENDING".equals(transaction.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Giao dịch đã được xử lý từ trước.");
        }

        // Cập nhật giao dịch thành SUCCESS
        transaction.setStatus("SUCCESS");
        transaction.setTransId("MOCK_TRANS_" + System.currentTimeMillis());
        paymentTransactionRepository.save(transaction);

        // Kích hoạt Premium
        activateUserSubscription(transaction.getUser(), transaction.getPlan());
    }

    private void activateUserSubscription(User user, SubscriptionPlan plan) {
        OffsetDateTime now = OffsetDateTime.now();

        // Kiểm tra xem user đã có gói đăng ký còn hiệu lực không
        Optional<UserSubscription> activeSubOpt = userSubscriptionRepository.findActiveSubscription(user.getId(), now);

        UserSubscription subscription;
        if (activeSubOpt.isPresent()) {
            // Gia hạn: ngày bắt đầu giữ nguyên, ngày kết thúc cộng thêm số tháng của gói
            // mới
            subscription = activeSubOpt.get();
            subscription.setEndDate(subscription.getEndDate().plusMonths(plan.getDurationMonths()));
            subscription.setPlan(plan);
            subscription.setStatus("ACTIVE");
        } else {
            // Tạo mới gói
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

    /**
     * Xác thực chữ ký số phản hồi của Momo.
     */
    private boolean validateMomoSignature(MomoIPNRequest ipn) {
        AppProperties.Momo momoConfig = appProperties.getMomo();

        // Format:
        // accessKey=$accessKey&amount=$amount&extraData=$extraData&message=$message&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&requestId=$requestId&resultCode=$resultCode&transId=$transId&responseTime=$responseTime
        String rawSignature = "accessKey=" + momoConfig.getAccessKey() +
                "&amount=" + ipn.getAmount() +
                "&extraData=" + (ipn.getExtraData() != null ? ipn.getExtraData() : "") +
                "&message=" + ipn.getMessage() +
                "&orderId=" + ipn.getOrderId() +
                "&orderInfo=" + ipn.getOrderInfo() +
                "&partnerCode=" + ipn.getPartnerCode() +
                "&requestId=" + ipn.getRequestId() +
                "&resultCode=" + ipn.getResultCode() +
                "&transId=" + ipn.getTransId() +
                "&responseTime=" + ipn.getResponseTime();

        String expectedSignature = signHmacSHA256(rawSignature, momoConfig.getSecretKey());
        return expectedSignature.equalsIgnoreCase(ipn.getSignature());
    }

    private String signHmacSHA256(String data, String key) {
        try {
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error signing HmacSHA256", e);
        }
    }
}
