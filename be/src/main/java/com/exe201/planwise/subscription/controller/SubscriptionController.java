package com.exe201.planwise.subscription.controller;

import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.subscription.dto.MomoIPNRequest;
import com.exe201.planwise.subscription.service.MomoPaymentService;
import com.exe201.planwise.subscription.service.PayosPaymentService;
import com.exe201.planwise.user.entity.PaymentTransaction;
import com.exe201.planwise.user.entity.SubscriptionPlan;
import com.exe201.planwise.user.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@Slf4j
public class SubscriptionController {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final MomoPaymentService momoPaymentService;
    private final PayosPaymentService payosPaymentService;

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlan>> getPlans() {
        return ResponseEntity.ok(subscriptionPlanRepository.findAll());
    }

    @PostMapping("/purchase")
    public ResponseEntity<Map<String, String>> purchasePlan(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> body) {

        String planIdStr = body.get("planId");

        if (planIdStr == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Thiếu planId"));
        }

        UUID planId = UUID.fromString(planIdStr);

        Map<String, String> payment = payosPaymentService.createPayment(principal.getId(), planId);

        return ResponseEntity.ok(payment);
    }

    @PostMapping("/payos-webhook")
    public ResponseEntity<Map<String, String>> payosWebhook(@RequestBody Object body) {
        log.info("Received PayOS webhook payload");
        payosPaymentService.processWebhook(body);
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    @PostMapping("/momo-ipn")
    public ResponseEntity<Void> receiveMomoIPN(@RequestBody MomoIPNRequest ipnRequest) {
        log.info("Received IPN webhook from Momo for order: {}", ipnRequest.getOrderId());
        try {
            momoPaymentService.processPaymentCallback(ipnRequest);
        } catch (Exception e) {
            log.error("Error processing Momo IPN webhook", e);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyPayment(@RequestBody MomoIPNRequest callbackParams) {
        log.info("Verifying callback params from client redirect for order: {}", callbackParams.getOrderId());
        momoPaymentService.processPaymentCallback(callbackParams);
        return ResponseEntity.ok(Map.of("status", "SUCCESS"));
    }

    @GetMapping("/transactions/{orderId}/status")
    public ResponseEntity<Map<String, String>> getTransactionStatus(@PathVariable String orderId) {
        PaymentTransaction transaction = payosPaymentService.getTransactionStatus(orderId);
        return ResponseEntity.ok(Map.of(
                "status", transaction.getStatus(),
                "orderId", transaction.getOrderId(),
                "amount", transaction.getAmount().toPlainString()));
    }

    @PostMapping("/mock-ipn")
    public ResponseEntity<Map<String, String>> mockIpn(@RequestParam String orderId) {
        log.info("Triggering mock PayOS payment confirmation for order: {}", orderId);
        payosPaymentService.mockConfirmPayment(orderId);
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Đã xác nhận giả lập thanh toán thành công!"));
    }
}