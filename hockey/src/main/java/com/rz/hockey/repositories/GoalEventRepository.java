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
            join g.match m
            join m.weeklyFixture wf
            join wf.leagueTable lt
            where lt.seasonYear = :seasonYear
            """)
    List<GoalEvent> findAllForRegularSeason(@Param("seasonYear") String seasonYear);

    @Query("""
            select distinct g from GoalEvent g
            left join fetch g.scorer
            left join fetch g.assist
            left join fetch g.team
            join g.playoffGame pg
            join pg.series s
            join s.bracket b
            where b.seasonYear = :seasonYear
            """)
    List<GoalEvent> findAllForPlayoffs(@Param("seasonYear") String seasonYear);
}
