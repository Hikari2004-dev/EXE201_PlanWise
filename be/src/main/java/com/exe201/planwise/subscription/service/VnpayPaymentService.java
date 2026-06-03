package com.exe201.planwise.subscription.service;

import com.exe201.planwise.config.AppProperties;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.PaymentTransaction;
import com.exe201.planwise.user.entity.SubscriptionPlan;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.PaymentTransactionRepository;
import com.exe201.planwise.user.repository.SubscriptionPlanRepository;
import com.exe201.planwise.user.repository.UserRepository;
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
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VnpayPaymentService {

    private final AppProperties appProperties;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

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

        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");

        params.put("vnp_CreateDate", formatter.format(calendar.getTime()));

        Calendar expire = Calendar.getInstance(TimeZone.getTimeZone("GMT+7"));
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