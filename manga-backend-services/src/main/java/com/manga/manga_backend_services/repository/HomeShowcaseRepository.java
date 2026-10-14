package com.manga.manga_backend_services.repository;

import com.manga.manga_backend_services.entity.HomeShowcase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HomeShowcaseRepository extends JpaRepository<HomeShowcase, UUID> {
    List<HomeShowcase> findByDisplaySectionAndIsActiveOrderBySortOrderAsc(String displaySection, Boolean isActive);
}
