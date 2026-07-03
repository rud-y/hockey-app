package com.rz.hockey.repositories;

import com.rz.hockey.entities.Match;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MatchRepository extends JpaRepository<Match, Long> {
    boolean existsByWeeklyFixture_LeagueTable_Id(Long leagueTableId);
}
