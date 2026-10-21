package com.fresher.library.repository;

import com.fresher.library.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long>, JpaSpecificationExecutor<Member> {
    Optional<Member> findByAccount_Id(Long accountId);
    Optional<Member> findByAccount_Email(String email);
}
