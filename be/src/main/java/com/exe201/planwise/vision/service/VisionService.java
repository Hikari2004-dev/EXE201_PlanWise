package com.exe201.planwise.vision.service;

import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import com.exe201.planwise.vision.dto.*;
import com.exe201.planwise.vision.entity.VisionItem;
import com.exe201.planwise.vision.repository.VisionItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class VisionService {

    private final VisionItemRepository visionItemRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<VisionItemDto> getVisionItems(UUID userId) {
        return visionItemRepository.findByUserIdOrderBySortOrderAsc(userId)
                .stream().map(VisionItemDto::from).toList();
    }

    @Transactional
    public VisionItemDto createVisionItem(UUID userId, CreateVisionItemRequest request) {
        User user = findUser(userId);

        VisionItem item = VisionItem.builder()
                .user(user)
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .imageUrl(request.imageUrl())
                .quote(request.quote())
                .build();

        item = visionItemRepository.save(item);
        log.info("Created vision item {} for user {}", item.getId(), userId);

        return VisionItemDto.from(item);
    }

    @Transactional
    public VisionItemDto updateVisionItem(UUID userId, UUID itemId, UpdateVisionItemRequest request) {
        VisionItem item = findItemAndValidateOwnership(itemId, userId);

        if (request.title() != null) item.setTitle(request.title());
        if (request.description() != null) item.setDescription(request.description());
        if (request.category() != null) item.setCategory(request.category());
        if (request.imageUrl() != null) item.setImageUrl(request.imageUrl());
        if (request.quote() != null) item.setQuote(request.quote());
        if (request.sortOrder() != null) item.setSortOrder((short) request.sortOrder().intValue());

        item = visionItemRepository.save(item);
        return VisionItemDto.from(item);
    }

    @Transactional
    public void deleteVisionItem(UUID userId, UUID itemId) {
        VisionItem item = findItemAndValidateOwnership(itemId, userId);
        visionItemRepository.delete(item);
        log.info("Deleted vision item {} for user {}", itemId, userId);
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private VisionItem findItemAndValidateOwnership(UUID itemId, UUID userId) {
        VisionItem item = visionItemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.VISION_ITEM_NOT_FOUND));

        if (!item.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.VISION_ITEM_NOT_FOUND);
        }
        return item;
    }
}
