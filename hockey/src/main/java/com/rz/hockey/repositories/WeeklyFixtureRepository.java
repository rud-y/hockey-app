package com.rz.hockey.repositories;

import com.rz.hockey.entities.WeeklyFixture;
import com.rz.hockey.enums.CompetitionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WeeklyFixtureRepository extends JpaRepository<WeeklyFixture, Long> {
    List<WeeklyFixture> findByLeagueTable_CompetitionTypeAndLeagueTable_SeasonYearOrderByWeekNumberAsc(
            CompetitionType competitionType,
            String seasonYear
    );
}
