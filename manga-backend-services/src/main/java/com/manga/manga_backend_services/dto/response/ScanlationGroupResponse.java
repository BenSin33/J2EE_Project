package com.manga.manga_backend_services.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScanlationGroupResponse {
    private UUID id;
    private UUID mangadexId;
    private String name;
    private String description;
    private UUID leaderId;
    private String website;
    private String discord;
    private String donationLink;
    private OffsetDateTime createdAt;
}
