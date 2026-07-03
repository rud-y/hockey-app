package com.rz.hockey.services;

import com.rz.hockey.dto.CreateTeamRequest;
import com.rz.hockey.entities.LeagueTable;
import com.rz.hockey.entities.Player;
import com.rz.hockey.entities.TableRow;
import com.rz.hockey.entities.Team;
import com.rz.hockey.repositories.LeagueTableRepository;
import com.rz.hockey.repositories.MatchRepository;
import com.rz.hockey.repositories.TeamRepository;
import com.rz.hockey.services.MatchService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TeamService {
    private final TeamRepository teamRepository;
    private final LeagueTableRepository leagueTableRepository;
    private final MatchRepository matchRepository;

    public TeamService(
            TeamRepository teamRepository,
            LeagueTableRepository leagueTableRepository,
            MatchRepository matchRepository) {
        this.teamRepository = teamRepository;
        this.leagueTableRepository = leagueTableRepository;
        this.matchRepository = matchRepository;
    }

    public List<Team> findAll() {
        return teamRepository.findAll();
    }

    @Transactional
    public TableRow createTeamWithLeagueRow(CreateTeamRequest request) {
        LeagueTable leagueTable = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(request.competitionType(), request.seasonYear())
                .orElseThrow(() -> new RuntimeException("League table not found for "
                        + request.competitionType() + " " + request.seasonYear()));

        String normalizedNam e = request.name().trim();
        String normalizedShortName = request.shortName().trim().toUpperCase();

        if (matchRepository.existsByWeeklyFixture_LeagueTable_Id(leagueTable.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot add teams after fixtures have been generated.");
        }

        if (leagueTable.getRows() != null && leagueTable.getRows().size() >= MatchService.MAX_TEAMS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Maximum of 14 teams allowed.");
        }

        if (leagueTable.getRows() != null) {
            boolean teamAlreadyInTable = leagueTable.getRows().stream()
                    .map(TableRow::getTeam)
                    .anyMatch(existingTeam ->
                            existingTeam.getName().equalsIgnoreCase(normalizedName)
                                    || existingTeam.getShortName().equalsIgnoreCase(normalizedShortName));

            if (teamAlreadyInTable) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "A team with this name or short name is already in the league table.");
            }
        }

        Team team = new Team(normalizedName, normalizedShortName);

        if (request.playerNames() != null) {
            for (String playerName : request.playerNames()) {
                if (playerName != null && !playerName.isBlank()) {
                    team.addPlayer(new Player(playerName.trim(), team));
                }
            }
        }

        teamRepository.save(team);

        TableRow row = new TableRow();
        row.setTeam(team);
        row.setGamesPlayed(0);
        row.setWins(0);
        row.setLosses(0);
        row.setOtLosses(0);
        row.setPoints(0);
        row.setStreakCount(0);

        leagueTable.addRow(row);
        leagueTableRepository.save(leagueTable);

        return row;
    }
}
