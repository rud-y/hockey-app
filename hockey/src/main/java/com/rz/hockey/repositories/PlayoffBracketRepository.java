package com.rz.hockey.repositories;

import com.rz.hockey.entities.PlayoffBracket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlayoffBracketRepository extends JpaRepository<PlayoffBracket, Long> {
    Optional<PlayoffBracket> findBySeasonYear(String seasonYear);

    boolean existsBySeasonYear(String seasonYear);
}
