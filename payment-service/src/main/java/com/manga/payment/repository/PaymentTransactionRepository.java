package com.manga.payment.repository;

import com.manga.payment.entity.PaymentTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    Optional<PaymentTransaction> findByTxnRef(String txnRef);
    Page<PaymentTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}

