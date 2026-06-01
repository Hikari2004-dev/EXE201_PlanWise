package com.exe201.planwise.task.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class TaskPriorityConverter implements AttributeConverter<Task.TaskPriority, String> {

    @Override
    public String convertToDatabaseColumn(Task.TaskPriority attribute) {
        return attribute == null ? null : attribute.getDbValue();
    }

    @Override
    public Task.TaskPriority convertToEntityAttribute(String dbData) {
        return Task.TaskPriority.fromDbValue(dbData);
    }
}
