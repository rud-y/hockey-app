package com.rz.hockey.repositories;

import com.rz.hockey.entities.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByTeam_Id(Long teamId);
}
