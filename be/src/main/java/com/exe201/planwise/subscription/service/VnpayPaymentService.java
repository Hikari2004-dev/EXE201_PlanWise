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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VnpayPaymentService {

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

        AppProperties.Vnpay vnpay = appProperties.getVnpay();

        String orderId = String.valueOf(System.currentTimeMillis());
        long amount = plan.getPrice().longValue();

        Map<String, String> params = new HashMap<>();

        params.put("vnp_Version", "2.1.1");
        params.put("vnp_Command", "pay");

        params.put("vnp_TmnCode", vnpay.getTmnCode());

        params.put("vnp_Amount", String.valueOf(amount * 100L));

        params.put("vnp_CurrCode", "VND");

        params.put("vnp_TxnRef", orderId);

        params.put("vnp_OrderInfo", "Thanh_toan_PlanWise");

        params.put("vnp_OrderType", "other");

        params.put("vnp_Locale", "vn");

        params.put("vnp_ReturnUrl", vnpay.getReturnUrl());

        params.put("vnp_IpAddr", "14.225.206.161");

        TimeZone vnpayTimeZone = TimeZone.getTimeZone("Etc/GMT-7");
        Calendar calendar = Calendar.getInstance(vnpayTimeZone);
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(vnpayTimeZone);

        params.put("vnp_CreateDate", formatter.format(calendar.getTime()));

        Calendar expire = Calendar.getInstance(vnpayTimeZone);
        expire.add(Calendar.MINUTE, 15);

        params.put("vnp_ExpireDate", formatter.format(expire.getTime()));

        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (String fieldName : fieldNames) {
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName)
                        .append("=")
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII)
                                .replaceAll("\\+", "%20"))
                        .append("&");

                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII))
                        .append("=")
                        .append(
                                URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII)
                                        .replaceAll("\\+", "%20"))
                        .append("&");
            }
        }

        hashData.deleteCharAt(hashData.length() - 1);
        query.deleteCharAt(query.length() - 1);

        String secureHash = hmacSHA512(vnpay.getHashSecret(), hashData.toString());

        log.info("VNPAY HASH DATA: {}", hashData);
        log.info("VNPAY SECURE HASH: {}", secureHash);

        query.append("&vnp_SecureHash=").append(secureHash);

        String paymentUrl = vnpay.getPayUrl() + "?" + query;

        PaymentTransaction transaction = PaymentTransaction.builder()
                .user(user)
                .plan(plan)
                .orderId(orderId)
                .requestId(orderId)
                .amount(plan.getPrice())
                .paymentMethod("VNPAY")
                .status("PENDING")
                .build();

        paymentTransactionRepository.save(transaction);

        return Map.of(
                "payUrl", paymentUrl,
                "orderId", orderId);
    }

    /**
     * Xác thực VNPay return URL callback: kiểm tra chữ ký, cập nhật giao dịch, kích hoạt Premium.
     */
    @Transactional
    public Map<String, String> verifyVnpayReturn(Map<String, String> vnpParams) {
        AppProperties.Vnpay vnpay = appProperties.getVnpay();

        // 1. Tách secure hash ra khỏi params để tạo chuỗi xác thực
        String vnpSecureHash = vnpParams.get("vnp_SecureHash");
        // Remove hash-related params trước khi tính toán
        Map<String, String> paramsToHash = new TreeMap<>(vnpParams);
        paramsToHash.remove("vnp_SecureHash");
        paramsToHash.remove("vnp_SecureHashType");

        // 2. Tạo chuỗi hash từ các params còn lại (đã sorted theo key)
        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : paramsToHash.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                hashData.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII));
                hashData.append("=");
                hashData.append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII).replaceAll("\\+", "%20"));
                hashData.append("&");
            }
        }
        // Bỏ ký tự & cuối
        if (hashData.length() > 0) {
            hashData.deleteCharAt(hashData.length() - 1);
        }

        String calculatedHash = hmacSHA512(vnpay.getHashSecret(), hashData.toString());

        log.info("VNPAY Return - Hash Data: {}", hashData);
        log.info("VNPAY Return - Calculated Hash: {}", calculatedHash);
        log.info("VNPAY Return - Received Hash: {}", vnpSecureHash);

        // 3. Kiểm tra chữ ký
        if (!calculatedHash.equalsIgnoreCase(vnpSecureHash)) {
            log.error("VNPay signature verification failed!");
            throw new AppException(ErrorCode.BAD_REQUEST, "Chữ ký VNPay không hợp lệ");
        }

        // 4. Kiểm tra response code
        String responseCode = vnpParams.get("vnp_ResponseCode");
        String txnRef = vnpParams.get("vnp_TxnRef");
        String transactionNo = vnpParams.get("vnp_TransactionNo");

        log.info("VNPay Return - ResponseCode: {}, TxnRef: {}, TransactionNo: {}", responseCode, txnRef, transactionNo);

        // 5. Tìm giao dịch
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(txnRef)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                        "Không tìm thấy giao dịch: " + txnRef));

        // Nếu đã xử lý trước đó
        if (!"PENDING".equals(transaction.getStatus())) {
            log.info("Transaction {} already processed with status: {}", txnRef, transaction.getStatus());
            return Map.of("status", transaction.getStatus(), "message", "Giao dịch đã được xử lý trước đó");
        }

        transaction.setTransId(transactionNo);
        transaction.setRawCallbackResponse(vnpParams.toString());

        if ("00".equals(responseCode)) {
            // Thanh toán thành công!
            transaction.setStatus("SUCCESS");
            paymentTransactionRepository.save(transaction);

            // Kích hoạt Premium
            activateUserSubscription(transaction.getUser(), transaction.getPlan());
            log.info("Successfully activated Premium for user: {} with plan: {}",
                    transaction.getUser().getEmail(), transaction.getPlan().getName());

            return Map.of("status", "SUCCESS", "message", "Thanh toán thành công");
        } else {
            // Thanh toán thất bại
            transaction.setStatus("FAILED");
            paymentTransactionRepository.save(transaction);
            log.warn("VNPay payment failed for order: {}, responseCode: {}", txnRef, responseCode);

            return Map.of("status", "FAILED", "message", "Thanh toán thất bại (Mã: " + responseCode + ")");
        }
    }

    /**
     * Giả lập IPN Webhook (Dành cho kiểm thử cục bộ không cần public URL).
     */
    @Transactional
    public void mockVnpayIpn(String orderId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByOrderId(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.TRANSACTION_NOT_FOUND,
                        "Không tìm thấy giao dịch: " + orderId));

        if (!"PENDING".equals(transaction.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Giao dịch đã được xử lý từ trước.");
        }

        // Cập nhật giao dịch thành SUCCESS
        transaction.setStatus("SUCCESS");
        transaction.setTransId("MOCK_VNPAY_" + System.currentTimeMillis());
        paymentTransactionRepository.save(transaction);

        // Kích hoạt Premium
        activateUserSubscription(transaction.getUser(), transaction.getPlan());
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

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hash = new StringBuilder();
            for (byte b : bytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1)
                    hash.append('0');
                hash.append(hex);
            }
            return hash.toString();
        } catch (Exception e) {
            throw new RuntimeException("Cannot create VNPAY secure hash", e);
        }
    }
}