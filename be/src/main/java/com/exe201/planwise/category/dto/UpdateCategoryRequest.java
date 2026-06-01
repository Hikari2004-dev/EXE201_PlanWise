package com.exe201.planwise.category.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
        @Size(max = 100, message = "Tên không được vượt quá 100 ký tự")
        String name,

        @Pattern(regexp = "^(indigo|blue|emerald|amber|rose|purple|teal|orange)$",
                message = "Màu phải là một trong: indigo, blue, emerald, amber, rose, purple, teal, orange")
        String color,

        Integer sortOrder
) {}
