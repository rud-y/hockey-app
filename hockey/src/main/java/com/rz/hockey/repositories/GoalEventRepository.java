package com.rz.hockey.repositories;

import com.rz.hockey.entities.GoalEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GoalEventRepository extends JpaRepository<GoalEvent, Long> {

    @Query("""
            select distinct g from GoalEvent g
            left join fetch g.scorer
            left join fetch g.assist
            left join fetch g.team
            left join g.match m
            left join m.weeklyFixture wf
            left join wf.leagueTable lt
            left join g.playoffGame pg
            left join pg.series s
            left join s.bracket b
            where lt.seasonYear = :seasonYear
               or b.seasonYear = :seasonYear
            """)
    List<GoalEvent> findAllForSeason(@Param("seasonYear") String seasonYear);
}
