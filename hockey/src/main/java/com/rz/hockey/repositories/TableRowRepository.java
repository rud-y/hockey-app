package com.rz.hockey.repositories;

import com.rz.hockey.entities.TableRow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TableRowRepository extends JpaRepository<TableRow, Long> {

    Optional<TableRow> findByTeam_IdAndLeagueTable_Id(Long teamId, Long leagueTableId);

    List<TableRow> findByLeagueTable_Id(Long leagueTableId);
}
