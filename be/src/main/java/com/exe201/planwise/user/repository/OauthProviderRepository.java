package com.exe201.planwise.user.repository;

import com.exe201.planwise.user.entity.OauthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OauthProviderRepository extends JpaRepository<OauthProvider, UUID> {

    Optional<OauthProvider> findByProviderAndProviderUid(String provider, String providerUid);
}
