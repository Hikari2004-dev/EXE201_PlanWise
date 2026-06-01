package com.exe201.planwise.config;

import com.exe201.planwise.user.enums.FocusSessionType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class FocusSessionTypeConverter implements AttributeConverter<FocusSessionType, String> {

    @Override
    public String convertToDatabaseColumn(FocusSessionType focusSessionType) {
        if (focusSessionType == null) {
            return null;
        }
        return focusSessionType.getValue();
    }

    @Override
    public FocusSessionType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return FocusSessionType.fromValue(dbData);
    }
}
