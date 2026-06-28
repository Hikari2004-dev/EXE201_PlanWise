package com.exe201.planwise.vision.service;

import com.exe201.planwise.category.entity.Category;
import com.exe201.planwise.category.repository.CategoryRepository;
import com.exe201.planwise.exception.AppException;
import com.exe201.planwise.exception.ErrorCode;
import com.exe201.planwise.user.entity.User;
import com.exe201.planwise.user.repository.UserRepository;
import com.exe201.planwise.vision.dto.CreateVisionItemRequest;
import com.exe201.planwise.vision.dto.PresignVisionImageUploadRequest;
import com.exe201.planwise.vision.dto.PresignVisionImageUploadResponse;
import com.exe201.planwise.vision.dto.UpdateVisionItemRequest;
import com.exe201.planwise.vision.dto.VisionItemDto;
import com.exe201.planwise.vision.entity.VisionItem;
import com.exe201.planwise.vision.repository.VisionItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class VisionService {

    private final VisionItemRepository visionItemRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final VisionImageUploadService visionImageUploadService;

    @Transactional(readOnly = true)
    public List<VisionItemDto> getVisionItems(UUID userId) {
        List<Category> userCategories = categoryRepository.findByUserIdOrderBySortOrderAsc(userId);
        return visionItemRepository.findByUserIdOrderBySortOrderAsc(userId)
                .stream()
                .map(item -> toDto(item, userCategories))
                .toList();
    }

    @Transactional
    public VisionItemDto createVisionItem(UUID userId, CreateVisionItemRequest request) {
        User user = findUser(userId);
        Category category = findCategory(request.categoryId(), userId);

        VisionItem item = VisionItem.builder()
                .user(user)
                .title(request.title())
                .description(request.description())
                .category(category.getId().toString())
                .imageUrl(request.imageUrl())
                .quote(request.quote())
                .build();

        item = visionItemRepository.save(item);
        log.info("Created vision item {} for user {}", item.getId(), userId);

        return toDto(item, category);
    }

    @Transactional
    public VisionItemDto updateVisionItem(UUID userId, UUID itemId, UpdateVisionItemRequest request) {
        VisionItem item = findItemAndValidateOwnership(itemId, userId);
        Category resolvedCategory = null;

        if (request.title() != null) item.setTitle(request.title());
        if (request.description() != null) item.setDescription(request.description());
        if (request.categoryId() != null) {
            resolvedCategory = findCategory(request.categoryId(), userId);
            item.setCategory(resolvedCategory.getId().toString());
        }
        if (request.imageUrl() != null) item.setImageUrl(request.imageUrl());
        if (request.quote() != null) item.setQuote(request.quote());
        if (request.sortOrder() != null) item.setSortOrder((short) request.sortOrder().intValue());

        item = visionItemRepository.save(item);

        if (resolvedCategory != null) {
            return toDto(item, resolvedCategory);
        }

        return toDto(item, categoryRepository.findByUserIdOrderBySortOrderAsc(userId));
    }

    @Transactional(readOnly = true)
    public PresignVisionImageUploadResponse presignVisionImageUpload(
            UUID userId,
            PresignVisionImageUploadRequest request
    ) {
        findUser(userId);
        return visionImageUploadService.presignUpload(userId, request);
    }

    @Transactional
    public void deleteVisionItem(UUID userId, UUID itemId) {
        VisionItem item = findItemAndValidateOwnership(itemId, userId);
        visionItemRepository.delete(item);
        log.info("Deleted vision item {} for user {}", itemId, userId);
    }

    private VisionItemDto toDto(VisionItem item, Category category) {
        return VisionItemDto.from(
                item,
                category.getId(),
                category.getName(),
                category.getColor().name()
        );
    }

    private VisionItemDto toDto(VisionItem item, List<Category> userCategories) {
        ResolvedVisionCategory resolved = resolveCategory(item.getCategory(), userCategories);
        return VisionItemDto.from(item, resolved.categoryId(), resolved.categoryName(), resolved.categoryColor());
    }

    private ResolvedVisionCategory resolveCategory(String storedCategory, List<Category> userCategories) {
        if (storedCategory == null || storedCategory.isBlank()) {
            return new ResolvedVisionCategory(null, "", null);
        }

        try {
            UUID categoryId = UUID.fromString(storedCategory);
            Category category = userCategories.stream()
                    .filter(item -> item.getId().equals(categoryId))
                    .findFirst()
                    .orElse(null);
            if (category != null) {
                return new ResolvedVisionCategory(category.getId(), category.getName(), category.getColor().name());
            }
        } catch (IllegalArgumentException ignored) {
        }

        String normalizedStoredCategory = normalize(storedCategory);
        Category directMatch = findByNormalizedNames(userCategories, Set.of(normalizedStoredCategory));
        if (directMatch != null) {
            return new ResolvedVisionCategory(directMatch.getId(), directMatch.getName(), directMatch.getColor().name());
        }

        Category legacyMatch = switch (normalizedStoredCategory) {
            case "career", "congviec" -> findByNormalizedNames(userCategories, Set.of("career", "congviec"));
            case "learning", "hoctap" -> findByNormalizedNames(userCategories, Set.of("learning", "hoctap"));
            case "health", "suckhoe" -> findByNormalizedNames(userCategories, Set.of("health", "suckhoe"));
            case "finance", "taichinh" -> findByNormalizedNames(userCategories, Set.of("finance", "taichinh"));
            default -> null;
        };

        if (legacyMatch != null) {
            return new ResolvedVisionCategory(legacyMatch.getId(), legacyMatch.getName(), legacyMatch.getColor().name());
        }

        return new ResolvedVisionCategory(null, storedCategory, null);
    }

    private Category findByNormalizedNames(List<Category> userCategories, Set<String> normalizedNames) {
        return userCategories.stream()
                .filter(category -> normalizedNames.contains(normalize(category.getName())))
                .findFirst()
                .orElse(null);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
        return normalized.trim();
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Category findCategory(UUID categoryId, UUID userId) {
        if (categoryId == null) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        return categoryRepository.findById(categoryId)
                .filter(category -> category.getUser().getId().equals(userId))
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    }

    private VisionItem findItemAndValidateOwnership(UUID itemId, UUID userId) {
        VisionItem item = visionItemRepository.findById(itemId)
                .orElseThrow(() -> new AppException(ErrorCode.VISION_ITEM_NOT_FOUND));

        if (!item.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.VISION_ITEM_NOT_FOUND);
        }
        return item;
    }

    private record ResolvedVisionCategory(UUID categoryId, String categoryName, String categoryColor) {
    }
}
