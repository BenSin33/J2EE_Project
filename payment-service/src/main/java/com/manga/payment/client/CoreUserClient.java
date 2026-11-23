package com.manga.payment.client;

import com.manga.payment.dto.PaymentDtos.CoreUserDto;
import com.manga.payment.dto.PaymentDtos.CreditUserRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.UUID;

@FeignClient(name = "manga-core-service")
public interface CoreUserClient {

    @GetMapping("/api/internal/users/by-username/{username}")
    CoreUserDto getUserByUsername(@PathVariable("username") String username);

    @PostMapping("/api/internal/users/{userId}/credit")
    CoreUserDto creditUser(@PathVariable("userId") UUID userId, @RequestBody CreditUserRequest request);
}

