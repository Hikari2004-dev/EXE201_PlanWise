package com.exe201.planwise.subscription.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Deprecated
public class VnpayPaymentService {

    private final PayosPaymentService payosPaymentService;

    public Map<String, String> createPayment(UUID userId, UUID planId) {
        return payosPaymentService.createPayment(userId, planId);
    }
}
