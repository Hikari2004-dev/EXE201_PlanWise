package com.exe201.planwise.task.controller;

import com.exe201.planwise.security.UserPrincipal;
import com.exe201.planwise.task.dto.*;
import com.exe201.planwise.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<TaskListResponse> getTasks(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(taskService.getTasks(principal.getId()));
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskDto> getTaskById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId) {
        return ResponseEntity.ok(taskService.getTaskById(principal.getId(), taskId));
    }

    @PostMapping
    public ResponseEntity<TaskDto> createTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.createTask(principal.getId(), request));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskDto> updateTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(principal.getId(), taskId, request));
    }

    @PostMapping("/{taskId}/toggle")
    public ResponseEntity<TaskDto> toggleComplete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId) {
        return ResponseEntity.ok(taskService.toggleComplete(principal.getId(), taskId));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID taskId) {
        taskService.deleteTask(principal.getId(), taskId);
        return ResponseEntity.noContent().build();
    }
}
