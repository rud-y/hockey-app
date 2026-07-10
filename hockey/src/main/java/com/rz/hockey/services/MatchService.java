package com.rz.hockey.services;

import com.rz.hockey.dto.FixturesResponse;
import com.rz.hockey.dto.MatchCompleteResponse;
import com.rz.hockey.dto.MatchResultRequest;
import com.rz.hockey.entities.LeagueTable;
import com.rz.hockey.entities.Match;
import com.rz.hockey.entities.TableRow;
import com.rz.hockey.entities.Team;
import com.rz.hockey.entities.WeeklyFixture;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.enums.StreakType;
import com.rz.hockey.repositories.LeagueTableRepository;
import com.rz.hockey.repositories.MatchRepository;
import com.rz.hockey.repositories.TableRowRepository;
import com.rz.hockey.repositories.WeeklyFixtureRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class MatchService {

    public static final int MAX_TEAMS = 14;
    public static final int MIN_TEAMS = 2;

    private final LeagueTableRepository leagueTableRepository;
    private final WeeklyFixtureRepository weeklyFixtureRepository;
    private final MatchRepository matchRepository;
    private final TableRowRepository tableRowRepository;
    private final LeagueTableService leagueTableService;

    public MatchService(
            LeagueTableRepository leagueTableRepository,
            WeeklyFixtureRepository weeklyFixtureRepository,
            MatchRepository matchRepository,
            TableRowRepository tableRowRepository,
            LeagueTableService leagueTableService) {
        this.leagueTableRepository = leagueTableRepository;
        this.weeklyFixtureRepository = weeklyFixtureRepository;
        this.matchRepository = matchRepository;
        this.tableRowRepository = tableRowRepository;
        this.leagueTableService = leagueTableService;
    }

    public FixturesResponse getFixtures(CompetitionType competitionType, String seasonYear) {
        LeagueTable leagueTable = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(competitionType, seasonYear)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "League table not found."));

        List<WeeklyFixture> fixtures = weeklyFixtureRepository
                .findByLeagueTable_CompetitionTypeAndLeagueTable_SeasonYearOrderByWeekNumberAsc(
                        competitionType, seasonYear);

        return new FixturesResponse(
                leagueTable.getActiveWeekNumber(),
                fixtures.size(),
                fixtures);
    }

    @Transactional
    public FixturesResponse generateFixtures(CompetitionType competitionType, String seasonYear) {
        LeagueTable leagueTable = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(competitionType, seasonYear)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "League table not found."));

        if (matchRepository.existsByWeeklyFixture_LeagueTable_Id(leagueTable.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Fixtures have already been generated for this league.");
        }

        return createFixturesForLeague(leagueTable);
    }

    @Transactional
    public FixturesResponse restartSeason(CompetitionType competitionType, String seasonYear) {
        LeagueTable leagueTable = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(competitionType, seasonYear)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "League table not found."));

        List<WeeklyFixture> fixtures = weeklyFixtureRepository
                .findByLeagueTable_CompetitionTypeAndLeagueTable_SeasonYearOrderByWeekNumberAsc(
                        competitionType, seasonYear);

        if (fixtures.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "No fixtures have been generated yet.");
        }

        int activeWeek = leagueTable.getActiveWeekNumber();
        int totalWeeks = fixtures.size();

        if (activeWeek < totalWeeks) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Complete all fixture weeks before playing again.");
        }

        WeeklyFixture finalWeek = fixtures.stream()
                .filter(fixture -> fixture.getWeekNumber() == activeWeek)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Final fixture week not found."));

        boolean finalWeekIncomplete = finalWeek.getMatches().stream().anyMatch(match -> !match.isCompleted());
        if (finalWeekIncomplete) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Complete all matches before playing again.");
        }

        resetTableRows(leagueTable);
        weeklyFixtureRepository.deleteAll(fixtures);

        return createFixturesForLeague(leagueTable);
    }

    private FixturesResponse createFixturesForLeague(LeagueTable leagueTable) {
        List<Team> teams = tableRowRepository.findByLeagueTable_Id(leagueTable.getId()).stream()
                .map(TableRow::getTeam)
                .toList();

        if (teams.size() < MIN_TEAMS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "At least 2 teams are required to generate fixtures.");
        }

        if (teams.size() > MAX_TEAMS) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Maximum of 14 teams allowed.");
        }

        List<List<Team[]>> roundPairings = buildRoundRobinPairings(teams);
        List<WeeklyFixture> fixtures = new ArrayList<>();

        for (int weekIndex = 0; weekIndex < roundPairings.size(); weekIndex++) {
            WeeklyFixture fixture = new WeeklyFixture(weekIndex + 1, leagueTable);

            for (Team[] pairing : roundPairings.get(weekIndex)) {
                fixture.addMatch(new Match(pairing[0], pairing[1]));
            }

            fixtures.add(weeklyFixtureRepository.save(fixture));
        }

        leagueTable.setActiveWeekNumber(1);
        leagueTableRepository.save(leagueTable);

        return new FixturesResponse(1, fixtures.size(), fixtures);
    }

    private void resetTableRows(LeagueTable leagueTable) {
        for (TableRow row : tableRowRepository.findByLeagueTable_Id(leagueTable.getId())) {
            row.setGamesPlayed(0);
            row.setWins(0);
            row.setLosses(0);
            row.setOtLosses(0);
            row.setPoints(0);
            row.setStreak(null);
            row.setStreakCount(0);
            tableRowRepository.save(row);
        }
    }

    @Transactional
    public FixturesResponse advanceToNextWeek(CompetitionType competitionType, String seasonYear) {
        LeagueTable leagueTable = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(competitionType, seasonYear)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "League table not found."));

        List<WeeklyFixture> fixtures = weeklyFixtureRepository
                .findByLeagueTable_CompetitionTypeAndLeagueTable_SeasonYearOrderByWeekNumberAsc(
                        competitionType, seasonYear);

        if (fixtures.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "No fixtures have been generated yet.");
        }

        int activeWeek = leagueTable.getActiveWeekNumber();
        WeeklyFixture currentWeek = fixtures.stream()
                .filter(fixture -> fixture.getWeekNumber() == activeWeek)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Current fixture week not found."));

        boolean weekIncomplete = currentWeek.getMatches().stream().anyMatch(match -> !match.isCompleted());
        if (weekIncomplete) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Complete all matches in the current week before advancing.");
        }

        int totalWeeks = fixtures.size();
        if (activeWeek >= totalWeeks) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "All fixture weeks have already been completed.");
        }

        leagueTable.setActiveWeekNumber(activeWeek + 1);
        leagueTableRepository.save(leagueTable);

        return new FixturesResponse(activeWeek + 1, totalWeeks, fixtures);
    }

    @Transactional
    public MatchCompleteResponse completeMatch(Long matchId, MatchResultRequest request) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Match not found."));

        if (match.isCompleted()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Match has already been completed.");
        }

        LeagueTable leagueTable = match.getWeeklyFixture().getLeagueTable();
        if (match.getWeeklyFixture().getWeekNumber() != leagueTable.getActiveWeekNumber()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only matches from the current fixture week can be played.");
        }

        validateScores(request);

        match.setHomeScorePeriod1(request.homeScorePeriod1());
        match.setAwayScorePeriod1(request.awayScorePeriod1());
        match.setHomeScorePeriod2(request.homeScorePeriod2());
        match.setAwayScorePeriod2(request.awayScorePeriod2());
        match.setHomeScorePeriod3(request.homeScorePeriod3());
        match.setAwayScorePeriod3(request.awayScorePeriod3());
        match.setHomeScoreOt(request.homeScoreOt());
        match.setAwayScoreOt(request.awayScoreOt());
        match.setCompleted(true);

        applyLeagueTableUpdates(match, request);
        Match savedMatch = matchRepository.save(match);

        List<TableRow> standings = leagueTableService.getStandingsByCompetition(
                leagueTable.getCompetitionType(),
                leagueTable.getSeasonYear());

        return new MatchCompleteResponse(savedMatch, standings);
    }

    private void validateScores(MatchResultRequest request) {
        validatePeriodScore(request.homeScorePeriod1());
        validatePeriodScore(request.awayScorePeriod1());
        validatePeriodScore(request.homeScorePeriod2());
        validatePeriodScore(request.awayScorePeriod2());
        validatePeriodScore(request.homeScorePeriod3());
        validatePeriodScore(request.awayScorePeriod3());

        int homeRegulation = request.homeScorePeriod1() + request.homeScorePeriod2() + request.homeScorePeriod3();
        int awayRegulation = request.awayScorePeriod1() + request.awayScorePeriod2() + request.awayScorePeriod3();
        boolean tiedAfterRegulation = homeRegulation == awayRegulation;

        if (tiedAfterRegulation) {
            boolean validOt = (request.homeScoreOt() == 1 && request.awayScoreOt() == 0)
                    || (request.homeScoreOt() == 0 && request.awayScoreOt() == 1);
            if (!validOt) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Overtime score must be 1:0 or 0:1.");
            }
        } else if (request.homeScoreOt() != 0 || request.awayScoreOt() != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Overtime scores are only allowed when regulation ends in a draw.");
        }
    }

    private void validatePeriodScore(int score) {
        if (score < 0 || score > 3) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Period scores must be between 0 and 3.");
        }
    }

    private void applyLeagueTableUpdates(Match match, MatchResultRequest request) {
        LeagueTable leagueTable = match.getWeeklyFixture().getLeagueTable();
        Team homeTeam = match.getHomeTeam();
        Team awayTeam = match.getAwayTeam();

        TableRow homeRow = findRowForTeam(leagueTable, homeTeam);
        TableRow awayRow = findRowForTeam(leagueTable, awayTeam);

        int homeRegulation = request.homeScorePeriod1() + request.homeScorePeriod2() + request.homeScorePeriod3();
        int awayRegulation = request.awayScorePeriod1() + request.awayScorePeriod2() + request.awayScorePeriod3();
        int homeTotal = homeRegulation + request.homeScoreOt();
        int awayTotal = awayRegulation + request.awayScoreOt();
        boolean wentToOvertime = homeRegulation == awayRegulation;

        homeRow.setGamesPlayed(homeRow.getGamesPlayed() + 1);
        awayRow.setGamesPlayed(awayRow.getGamesPlayed() + 1);

        if (homeTotal > awayTotal) {
            homeRow.setWins(homeRow.getWins() + 1);
            homeRow.setPoints(homeRow.getPoints() + 2);
            updateStreak(homeRow, StreakType.W);

            if (wentToOvertime) {
                awayRow.setOtLosses(awayRow.getOtLosses() + 1);
                awayRow.setPoints(awayRow.getPoints() + 1);
            } else {
                awayRow.setLosses(awayRow.getLosses() + 1);
            }
            updateStreak(awayRow, StreakType.L);
        } else {
            awayRow.setWins(awayRow.getWins() + 1);
            awayRow.setPoints(awayRow.getPoints() + 2);
            updateStreak(awayRow, StreakType.W);

            if (wentToOvertime) {
                homeRow.setOtLosses(homeRow.getOtLosses() + 1);
                homeRow.setPoints(homeRow.getPoints() + 1);
            } else {
                homeRow.setLosses(homeRow.getLosses() + 1);
            }
            updateStreak(homeRow, StreakType.L);
        }

        tableRowRepository.save(homeRow);
        tableRowRepository.save(awayRow);
        leagueTableRepository.save(leagueTable);
    }

    private TableRow findRowForTeam(LeagueTable leagueTable, Team team) {
        return tableRowRepository
                .findByTeam_IdAndLeagueTable_Id(team.getId(), leagueTable.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Team row not found in league table."));
    }

    private void updateStreak(TableRow row, StreakType latestResult) {
        if (row.getStreak() == latestResult) {
            row.setStreakCount(row.getStreakCount() + 1);
        } else {
            row.setStreak(latestResult);
            row.setStreakCount(1);
        }
    }

    private List<List<Team[]>> buildRoundRobinPairings(List<Team> teams) {
        List<Team> rotatingTeams = new ArrayList<>(teams);
        if (rotatingTeams.size() % 2 != 0) {
            rotatingTeams.add(null);
        }

        int teamCount = rotatingTeams.size();
        int rounds = teamCount - 1;
        List<List<Team[]>> allRounds = new ArrayList<>();

        for (int round = 0; round < rounds; round++) {
            List<Team[]> roundMatches = new ArrayList<>();

            for (int i = 0; i < teamCount / 2; i++) {
                Team home = rotatingTeams.get(i);
                Team away = rotatingTeams.get(teamCount - 1 - i);

                if (home != null && away != null) {
                    roundMatches.add(new Team[]{home, away});
                }
            }

            allRounds.add(roundMatches);

            Team fixed = rotatingTeams.get(0);
            Team moved = rotatingTeams.remove(teamCount - 1);
            List<Team> rest = new ArrayList<>(rotatingTeams.subList(1, teamCount - 1));
            rotatingTeams = new ArrayList<>();
            rotatingTeams.add(fixed);
            rotatingTeams.add(moved);
            rotatingTeams.addAll(rest);
        }

        return allRounds;
    }
}
