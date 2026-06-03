package com.exe201.planwise.subscription.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VnpayPaymentResponse {
    private String paymentUrl;
}