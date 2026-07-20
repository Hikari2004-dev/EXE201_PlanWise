package com.exe201.planwise.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // Auth
    EMAIL_ALREADY_EXISTS      (HttpStatus.CONFLICT,              "Email đã được sử dụng"),
    INVALID_CREDENTIALS       (HttpStatus.UNAUTHORIZED,          "Email hoặc mật khẩu không đúng"),
    INVALID_TOKEN             (HttpStatus.UNAUTHORIZED,          "Token không hợp lệ hoặc đã hết hạn"),
    REFRESH_TOKEN_EXPIRED     (HttpStatus.UNAUTHORIZED,          "Refresh token đã hết hạn"),
    USER_NOT_FOUND            (HttpStatus.NOT_FOUND,             "Không tìm thấy người dùng"),
    USER_DISABLED             (HttpStatus.FORBIDDEN,             "Tài khoản đã bị vô hiệu hoá"),
    EMAIL_NOT_VERIFIED        (HttpStatus.FORBIDDEN,             "Email chưa được xác thực"),
    INVALID_VERIFICATION_TOKEN(HttpStatus.BAD_REQUEST,          "Liên kết xác thực không hợp lệ"),
    VERIFICATION_TOKEN_EXPIRED(HttpStatus.BAD_REQUEST,          "Liên kết xác thực đã hết hạn"),

    // OAuth2
    OAUTH2_PROVIDER_NOT_SUPPORTED(HttpStatus.BAD_REQUEST,        "OAuth2 provider không được hỗ trợ"),
    OAUTH2_EMAIL_NOT_FOUND    (HttpStatus.BAD_REQUEST,           "Không lấy được email từ OAuth2 provider"),
    OAUTH2_REDIRECT_URI_MISMATCH(HttpStatus.BAD_REQUEST,         "Redirect URI không hợp lệ"),
    CALENDAR_SYNC_FAILED       (HttpStatus.BAD_GATEWAY,          "Không thể đồng bộ sự kiện với lịch bên ngoài"),

    // General
    BAD_REQUEST               (HttpStatus.BAD_REQUEST,           "Yêu cầu không hợp lệ"),
    INTERNAL_SERVER_ERROR     (HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống, vui lòng thử lại sau"),

    // Subscription & Payment
    PLAN_NOT_FOUND            (HttpStatus.NOT_FOUND,             "Không tìm thấy gói hội viên"),
    MOMO_PAYMENT_FAILED       (HttpStatus.BAD_REQUEST,          "Giao dịch Momo thất bại"),
    MOMO_SIGNATURE_INVALID    (HttpStatus.BAD_REQUEST,          "Chữ ký xác thực Momo không hợp lệ"),
    TRANSACTION_NOT_FOUND     (HttpStatus.NOT_FOUND,            "Không tìm thấy giao dịch"),

    // Premium Limits
    GOAL_LIMIT_EXCEEDED      (HttpStatus.FORBIDDEN,            "Bạn đã đạt giới hạn 3 mục tiêu. Vui lòng nâng cấp Premium để thêm mục tiêu không giới hạn."),
    HABIT_LIMIT_EXCEEDED      (HttpStatus.FORBIDDEN,            "Bạn đã đạt giới hạn 3 thói quen. Vui lòng nâng cấp Premium để thêm thói quen không giới hạn."),
    CATEGORY_LIMIT_EXCEEDED   (HttpStatus.FORBIDDEN,            "Bạn chỉ có thể sử dụng 6 danh mục mặc định. Vui lòng nâng cấp Premium để tạo danh mục tùy chỉnh."),

    // Resource
    GOAL_NOT_FOUND            (HttpStatus.NOT_FOUND,            "Không tìm thấy mục tiêu"),
    MILESTONE_NOT_FOUND       (HttpStatus.NOT_FOUND,            "Không tìm thấy cột mốc"),
    HABIT_NOT_FOUND           (HttpStatus.NOT_FOUND,           "Không tìm thấy thói quen"),
    CATEGORY_NOT_FOUND        (HttpStatus.NOT_FOUND,           "Không tìm thấy danh mục"),
    CANNOT_DELETE_DEFAULT_CATEGORY(HttpStatus.BAD_REQUEST,      "Không thể xóa danh mục mặc định"),
    TASK_NOT_FOUND            (HttpStatus.NOT_FOUND,            "Không tìm thấy công việc"),
    AI_DRAFT_NOT_FOUND        (HttpStatus.NOT_FOUND,            "Không tìm thấy bản nháp AI"),
    AI_DRAFT_INVALID          (HttpStatus.BAD_REQUEST,          "Bản nháp AI không hợp lệ"),
    AI_SERVICE_ERROR          (HttpStatus.SERVICE_UNAVAILABLE, "Lỗi khi gọi dịch vụ AI"),
    EVENT_NOT_FOUND           (HttpStatus.NOT_FOUND,           "Không tìm thấy sự kiện"),
    FOCUS_SESSION_NOT_FOUND   (HttpStatus.NOT_FOUND,            "Không tìm thấy phiên tập trung"),
    QUICK_NOTE_NOT_FOUND      (HttpStatus.NOT_FOUND,           "Không tìm thấy ghi chú nhanh"),
    REFLECTION_NOT_FOUND       (HttpStatus.NOT_FOUND,           "Không tìm thấy nhật ký"),
    NOTIFICATION_NOT_FOUND    (HttpStatus.NOT_FOUND,           "Không tìm thấy thông báo");

    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }
}
