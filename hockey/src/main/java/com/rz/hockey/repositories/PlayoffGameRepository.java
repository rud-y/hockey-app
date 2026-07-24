package com.rz.hockey.repositories;

import com.rz.hockey.entities.PlayoffGame;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayoffGameRepository extends JpaRepository<PlayoffGame, Long> {
}
