package com.exe201.planwise.user.enums;

public enum FocusSessionType {
    POMODORO("pomodoro"),
    FLOWTIME("flowtime"),
    SPRINT("sprint"),
    DEEP("deep");

    private final String value;

    FocusSessionType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static FocusSessionType fromValue(String value) {
        for (FocusSessionType type : FocusSessionType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        return POMODORO;
    }
}
