package com.rz.hockey.repositories;
import com.rz.hockey.entities.Team;
import com.rz.hockey.enums.CompetitionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Team findByPlayers_Name(String name);
}
