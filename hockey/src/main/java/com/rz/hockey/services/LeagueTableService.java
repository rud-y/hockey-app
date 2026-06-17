package com.rz.hockey.services;
import com.rz.hockey.entities.LeagueTable;
import com.rz.hockey.entities.TableRow;
import com.rz.hockey.entities.Team;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.repositories.LeagueTableRepository;
import com.rz.hockey.repositories.TableRowRepository;
import com.rz.hockey.repositories.TeamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.stream.Collectors;

import java.util.List;

@Service
public class LeagueTableService {

    private final LeagueTableRepository leagueTableRepository;
    private final TableRowRepository tableRowRepository;
    private final TeamRepository teamRepository;

    public LeagueTableService(
            LeagueTableRepository leagueTableRepository,
            TableRowRepository tableRowRepository,
            TeamRepository teamRepository) {
        this.leagueTableRepository = leagueTableRepository;
        this.tableRowRepository = tableRowRepository;
        this.teamRepository = teamRepository;
    }

    public List<TableRow> getStandings(Long leagueTableId) {
        LeagueTable table = leagueTableRepository.findById(leagueTableId)
                .orElseThrow(() -> new RuntimeException("League table not found"));

        return table.getRows();
    }

    public List<Team> getTeamsByCompetition(
            CompetitionType competitionType,
            String seasonYear
    ) {
        LeagueTable table = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(competitionType, seasonYear)
                .orElseThrow(() -> new RuntimeException("The league table was not found.."));


        return table.getRows().stream()
                .map(TableRow::getTeam)
                .collect(Collectors.toList());
    }

    public List<TableRow> getStandingsByCompetition(
            CompetitionType competitionType,
            String seasonYear
    ) {
        LeagueTable table = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(competitionType, seasonYear)
                .orElseThrow(() -> new RuntimeException("The league table was not found.."));

        return table.getRows();
    }

    @Transactional
    public void deleteTableRow(Long rowId) {
        TableRow row = tableRowRepository.findById(rowId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Table row not found."));

        LeagueTable leagueTable = row.getLeagueTable();
        Team team = row.getTeam();

        if (leagueTable.getRows() != null) {
            leagueTable.getRows().remove(row);
        }

        tableRowRepository.delete(row);
        teamRepository.delete(team);
    }

}
