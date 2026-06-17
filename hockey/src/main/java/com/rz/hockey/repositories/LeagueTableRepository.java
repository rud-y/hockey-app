package com.rz.hockey.repositories;

import com.rz.hockey.entities.LeagueTable;
import com.rz.hockey.enums.CompetitionType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LeagueTableRepository extends JpaRepository<LeagueTable, Long> {

    Optional<LeagueTable> findByCompetitionTypeAndSeasonYear(
            CompetitionType competitionType,
            String seasonYear
    );
}
