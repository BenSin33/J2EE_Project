package com.manga.manga_backend_services.specification;

import com.manga.manga_backend_services.entity.Manga;
import org.springframework.data.jpa.domain.Specification;

public class MangaSpecification {

    public static Specification<Manga> hasTitle(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get("title")), "%" + keyword.trim().toLowerCase() + "%");
        };
    }

    public static Specification<Manga> hasStatus(String status) {
        return (root, query, cb) -> {
            if (status == null || status.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<Manga> hasApprovalStatus(String approvalStatus) {
        return (root, query, cb) -> {
            if (approvalStatus == null || approvalStatus.trim().isEmpty()) {
                return cb.conjunction();
            }
            return cb.equal(root.get("approvalStatus"), approvalStatus);
        };
    }
}
