package com.rz.hockey.services;

import com.rz.hockey.entities.LeagueTable;
import com.rz.hockey.entities.Match;
import com.rz.hockey.entities.TableRow;
import com.rz.hockey.entities.Team;
import com.rz.hockey.entities.WeeklyFixture;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.repositories.LeagueTableRepository;
import com.rz.hockey.repositories.TableRowRepository;
import com.rz.hockey.repositories.TeamRepository;
import com.rz.hockey.repositories.WeeklyFixtureRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LeagueTableService {

    private final LeagueTableRepository leagueTableRepository;
    private final TableRowRepository tableRowRepository;
    private final TeamRepository teamRepository;
    private final WeeklyFixtureRepository weeklyFixtureRepository;

    public LeagueTableService(
            LeagueTableRepository leagueTableRepository,
            TableRowRepository tableRowRepository,
            TeamRepository teamRepository,
            WeeklyFixtureRepository weeklyFixtureRepository) {
        this.leagueTableRepository = leagueTableRepository;
        this.tableRowRepository = tableRowRepository;
        this.teamRepository = teamRepository;
        this.weeklyFixtureRepository = weeklyFixtureRepository;
    }

    @Transactional
    public List<TableRow> getStandings(Long leagueTableId) {
        LeagueTable table = leagueTableRepository.findById(leagueTableId)
                .orElseThrow(() -> new RuntimeException("League table not found"));

        syncGoalsFromMatches(table);
        return sortStandings(tableRowRepository.findByLeagueTable_Id(table.getId()));
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

    @Transactional
    public List<TableRow> getStandingsByCompetition(
            CompetitionType competitionType,
            String seasonYear
    ) {
        LeagueTable table = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(competitionType, seasonYear)
                .orElseThrow(() -> new RuntimeException("The league table was not found.."));

        syncGoalsFromMatches(table);
        return sortStandings(tableRowRepository.findByLeagueTable_Id(table.getId()));
    }

    private List<TableRow> sortStandings(List<TableRow> rows) {
        return rows.stream()
                .sorted(Comparator
                        .comparing(TableRow::getPoints, Comparator.reverseOrder())
                        .thenComparing(TableRow::getWins, Comparator.reverseOrder())
                        .thenComparing(TableRow::getLosses)
                        .thenComparing(TableRow::getOtLosses)
                        .thenComparing(TableRow::getGoalsFor, Comparator.reverseOrder())
                        .thenComparing(TableRow::getGoalsAgainst))
                .collect(Collectors.toList());
    }

    /**
     * Rebuilds GF/GA on each table row from completed regular-season matches.
     * Keeps standings correct after schema upgrades or matches played before GF/GA existed.
     */
    private void syncGoalsFromMatches(LeagueTable table) {
        List<TableRow> rows = tableRowRepository.findByLeagueTable_Id(table.getId());
        Map<Long, TableRow> rowsByTeamId = new HashMap<>();
        for (TableRow row : rows) {
            row.setGoalsFor(0);
            row.setGoalsAgainst(0);
            rowsByTeamId.put(row.getTeam().getId(), row);
        }

        List<WeeklyFixture> fixtures = weeklyFixtureRepository
                .findByLeagueTable_CompetitionTypeAndLeagueTable_SeasonYearOrderByWeekNumberAsc(
                        table.getCompetitionType(), table.getSeasonYear());

        for (WeeklyFixture fixture : fixtures) {
            for (Match match : fixture.getMatches()) {
                if (!match.isCompleted()) {
                    continue;
                }

                int homeTotal = matchTotal(match, true);
                int awayTotal = matchTotal(match, false);

                TableRow homeRow = rowsByTeamId.get(match.getHomeTeam().getId());
                TableRow awayRow = rowsByTeamId.get(match.getAwayTeam().getId());
                if (homeRow != null) {
                    homeRow.addMatchGoals(homeTotal, awayTotal);
                }
                if (awayRow != null) {
                    awayRow.addMatchGoals(awayTotal, homeTotal);
                }
            }
        }

        tableRowRepository.saveAll(rows);
    }

    private static int matchTotal(Match match, boolean home) {
        if (home) {
            return match.getHomeScorePeriod1()
                    + match.getHomeScorePeriod2()
                    + match.getHomeScorePeriod3()
                    + match.getHomeScoreOt();
        }
        return match.getAwayScorePeriod1()
                + match.getAwayScorePeriod2()
                + match.getAwayScorePeriod3()
                + match.getAwayScoreOt();
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
