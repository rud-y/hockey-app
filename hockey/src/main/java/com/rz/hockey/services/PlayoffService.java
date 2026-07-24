package com.rz.hockey.services;

import com.rz.hockey.dto.MatchResultRequest;
import com.rz.hockey.dto.SeasonRequest;
import com.rz.hockey.entities.LeagueTable;
import com.rz.hockey.entities.PlayoffBracket;
import com.rz.hockey.entities.PlayoffGame;
import com.rz.hockey.entities.PlayoffSeries;
import com.rz.hockey.entities.TableRow;
import com.rz.hockey.entities.Team;
import com.rz.hockey.entities.WeeklyFixture;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.enums.PlayoffStatus;
import com.rz.hockey.repositories.LeagueTableRepository;
import com.rz.hockey.repositories.PlayoffBracketRepository;
import com.rz.hockey.repositories.PlayoffGameRepository;
import com.rz.hockey.repositories.TableRowRepository;
import com.rz.hockey.repositories.TeamRepository;
import com.rz.hockey.repositories.WeeklyFixtureRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class PlayoffService {

    private final PlayoffBracketRepository playoffBracketRepository;
    private final PlayoffGameRepository playoffGameRepository;
    private final LeagueTableRepository leagueTableRepository;
    private final WeeklyFixtureRepository weeklyFixtureRepository;
    private final TableRowRepository tableRowRepository;
    private final TeamRepository teamRepository;
    private final LeagueTableService leagueTableService;

    public PlayoffService(
            PlayoffBracketRepository playoffBracketRepository,
            PlayoffGameRepository playoffGameRepository,
            LeagueTableRepository leagueTableRepository,
            WeeklyFixtureRepository weeklyFixtureRepository,
            TableRowRepository tableRowRepository,
            TeamRepository teamRepository,
            LeagueTableService leagueTableService) {
        this.playoffBracketRepository = playoffBracketRepository;
        this.playoffGameRepository = playoffGameRepository;
        this.leagueTableRepository = leagueTableRepository;
        this.weeklyFixtureRepository = weeklyFixtureRepository;
        this.tableRowRepository = tableRowRepository;
        this.teamRepository = teamRepository;
        this.leagueTableService = leagueTableService;
    }

    public Optional<PlayoffBracket> getBracket(String seasonYear) {
        return playoffBracketRepository.findBySeasonYear(seasonYear);
    }

    @Transactional
    public PlayoffBracket startPlayoffs(SeasonRequest request) {
        if (request.competitionType() != CompetitionType.REGULAR_SEASON) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Playoffs can only be started from the regular season.");
        }

        String seasonYear = request.seasonYear();
        if (playoffBracketRepository.existsBySeasonYear(seasonYear)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Playoffs have already been started for this season.");
        }

        LeagueTable leagueTable = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(CompetitionType.REGULAR_SEASON, seasonYear)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "League table not found."));

        ensureRegularSeasonComplete(leagueTable, seasonYear);

        List<TableRow> standings = leagueTableService.getStandingsByCompetition(
                CompetitionType.REGULAR_SEASON, seasonYear);

        int playoffSpots = MatchService.getPlayoffTeamCount(standings.size());
        if (playoffSpots < 2) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "At least 2 playoff teams are required.");
        }

        List<TableRow> playoffRows = standings.subList(0, playoffSpots);
        int totalRounds = Integer.numberOfTrailingZeros(playoffSpots);

        PlayoffBracket bracket = new PlayoffBracket(seasonYear, playoffSpots, totalRounds);
        createRoundSeries(bracket, 1, toSeededTeams(playoffRows));
        return playoffBracketRepository.save(bracket);
    }

    @Transactional
    public PlayoffBracket completeGame(Long gameId, MatchResultRequest request) {
        PlayoffGame game = playoffGameRepository.findById(gameId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Playoff game not found."));

        if (game.isCompleted()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Playoff game has already been completed.");
        }

        PlayoffSeries series = game.getSeries();
        PlayoffBracket bracket = series.getBracket();

        if (bracket.getStatus() == PlayoffStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "The playoffs are already completed.");
        }

        if (series.isCompleted()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This series is already completed.");
        }

        if (series.getRoundNumber() != bracket.getCurrentRound()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only games from the current playoff round can be played.");
        }

        boolean isLatestGame = series.getGames().stream()
                .mapToInt(PlayoffGame::getGameNumber)
                .max()
                .orElse(0) == game.getGameNumber();
        if (!isLatestGame || game.getGameNumber() != series.getGames().size()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only the next game in the series can be played.");
        }

        MatchService.validateMatchScores(request);

        game.setHomeScorePeriod1(request.homeScorePeriod1());
        game.setAwayScorePeriod1(request.awayScorePeriod1());
        game.setHomeScorePeriod2(request.homeScorePeriod2());
        game.setAwayScorePeriod2(request.awayScorePeriod2());
        game.setHomeScorePeriod3(request.homeScorePeriod3());
        game.setAwayScorePeriod3(request.awayScorePeriod3());
        game.setHomeScoreOt(request.homeScoreOt());
        game.setAwayScoreOt(request.awayScoreOt());
        game.setCompleted(true);

        int homeRegulation = request.homeScorePeriod1() + request.homeScorePeriod2() + request.homeScorePeriod3();
        int awayRegulation = request.awayScorePeriod1() + request.awayScorePeriod2() + request.awayScorePeriod3();
        int homeTotal = homeRegulation + request.homeScoreOt();
        int awayTotal = awayRegulation + request.awayScoreOt();

        game.getHomeTeam().addMatchGoals(homeTotal, awayTotal);
        game.getAwayTeam().addMatchGoals(awayTotal, homeTotal);

        Team gameWinner = resolveGameWinner(game, request);
        if (gameWinner.getId().equals(series.getHigherSeedTeam().getId())) {
            series.setHigherSeedWins(series.getHigherSeedWins() + 1);
        } else {
            series.setLowerSeedWins(series.getLowerSeedWins() + 1);
        }

        if (series.getHigherSeedWins() >= PlayoffSeries.WINS_TO_ADVANCE) {
            series.setWinner(series.getHigherSeedTeam());
            series.setCompleted(true);
        } else if (series.getLowerSeedWins() >= PlayoffSeries.WINS_TO_ADVANCE) {
            series.setWinner(series.getLowerSeedTeam());
            series.setCompleted(true);
        } else if (series.getGames().size() < PlayoffSeries.MAX_GAMES) {
            series.addGame(new PlayoffGame(
                    series.getGames().size() + 1,
                    series.getHigherSeedTeam(),
                    series.getLowerSeedTeam()));
        } else {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, "Series reached max games without a winner.");
        }

        maybeAdvanceRound(bracket);
        return playoffBracketRepository.save(bracket);
    }

    @Transactional
    public void deleteBracketForSeason(String seasonYear) {
        playoffBracketRepository.findBySeasonYear(seasonYear)
                .ifPresent(playoffBracketRepository::delete);
    }

    @Transactional
    public void startFromScratch(SeasonRequest request) {
        String seasonYear = request.seasonYear();
        CompetitionType competitionType = request.competitionType();

        deleteBracketForSeason(seasonYear);

        LeagueTable leagueTable = leagueTableRepository
                .findByCompetitionTypeAndSeasonYear(competitionType, seasonYear)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "League table not found."));

        List<WeeklyFixture> fixtures = weeklyFixtureRepository
                .findByLeagueTable_CompetitionTypeAndLeagueTable_SeasonYearOrderByWeekNumberAsc(
                        competitionType, seasonYear);
        weeklyFixtureRepository.deleteAll(fixtures);

        List<TableRow> rows = new ArrayList<>(tableRowRepository.findByLeagueTable_Id(leagueTable.getId()));
        List<Team> teams = rows.stream().map(TableRow::getTeam).toList();

        if (leagueTable.getRows() != null) {
            leagueTable.getRows().clear();
        }
        tableRowRepository.deleteAll(rows);
        teamRepository.deleteAll(teams);

        leagueTable.setActiveWeekNumber(1);
        leagueTableRepository.save(leagueTable);
    }

    private void maybeAdvanceRound(PlayoffBracket bracket) {
        List<PlayoffSeries> currentRoundSeries = bracket.getSeries().stream()
                .filter(series -> series.getRoundNumber() == bracket.getCurrentRound())
                .sorted(Comparator.comparingInt(PlayoffSeries::getSeriesIndex))
                .toList();

        boolean roundComplete = currentRoundSeries.stream().allMatch(PlayoffSeries::isCompleted);
        if (!roundComplete) {
            return;
        }

        if (bracket.getCurrentRound() >= bracket.getTotalRounds()) {
            PlayoffSeries finalSeries = currentRoundSeries.get(0);
            bracket.setChampion(finalSeries.getWinner());
            bracket.setStatus(PlayoffStatus.COMPLETED);
            return;
        }

        List<SeededTeam> winners = currentRoundSeries.stream()
                .map(series -> {
                    Team winner = series.getWinner();
                    int rank = winner.getId().equals(series.getHigherSeedTeam().getId())
                            ? series.getHigherSeedRank()
                            : series.getLowerSeedRank();
                    return new SeededTeam(winner, rank);
                })
                .toList();

        int nextRound = bracket.getCurrentRound() + 1;
        createRoundSeries(bracket, nextRound, winners);
        bracket.setCurrentRound(nextRound);
    }

    private void createRoundSeries(PlayoffBracket bracket, int roundNumber, List<SeededTeam> orderedSeeds) {
        if (orderedSeeds.size() % 2 != 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Playoff rounds require an even number of teams.");
        }

        List<SeededTeam> paired = new ArrayList<>();
        if (roundNumber == 1) {
            // 1 vs last, 2 vs 2nd-last, ...
            int n = orderedSeeds.size();
            for (int i = 0; i < n / 2; i++) {
                SeededTeam higher = orderedSeeds.get(i);
                SeededTeam lower = orderedSeeds.get(n - 1 - i);
                paired.add(higher);
                paired.add(lower);
            }
        } else {
            paired.addAll(orderedSeeds);
        }

        int seriesCount = paired.size() / 2;
        for (int i = 0; i < seriesCount; i++) {
            SeededTeam first = paired.get(i * 2);
            SeededTeam second = paired.get(i * 2 + 1);

            SeededTeam higher = first.rank() <= second.rank() ? first : second;
            SeededTeam lower = first.rank() <= second.rank() ? second : first;

            PlayoffSeries series = new PlayoffSeries(
                    roundNumber,
                    i,
                    higher.team(),
                    lower.team(),
                    higher.rank(),
                    lower.rank());
            series.addGame(new PlayoffGame(1, higher.team(), lower.team()));
            bracket.addSeries(series);
        }
    }

    private List<SeededTeam> toSeededTeams(List<TableRow> playoffRows) {
        List<SeededTeam> seeded = new ArrayList<>();
        for (int i = 0; i < playoffRows.size(); i++) {
            seeded.add(new SeededTeam(playoffRows.get(i).getTeam(), i + 1));
        }
        return seeded;
    }

    private void ensureRegularSeasonComplete(LeagueTable leagueTable, String seasonYear) {
        List<WeeklyFixture> fixtures = weeklyFixtureRepository
                .findByLeagueTable_CompetitionTypeAndLeagueTable_SeasonYearOrderByWeekNumberAsc(
                        CompetitionType.REGULAR_SEASON, seasonYear);

        if (fixtures.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Generate and complete regular season fixtures first.");
        }

        int totalWeeks = fixtures.size();
        if (leagueTable.getActiveWeekNumber() < totalWeeks) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Complete all regular season weeks before playoffs.");
        }

        WeeklyFixture finalWeek = fixtures.stream()
                .filter(fixture -> fixture.getWeekNumber() == leagueTable.getActiveWeekNumber())
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Final fixture week not found."));

        boolean incomplete = finalWeek.getMatches().stream().anyMatch(match -> !match.isCompleted());
        if (incomplete) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Complete all regular season matches before playoffs.");
        }
    }

    private Team resolveGameWinner(PlayoffGame game, MatchResultRequest request) {
        int homeRegulation = request.homeScorePeriod1() + request.homeScorePeriod2() + request.homeScorePeriod3();
        int awayRegulation = request.awayScorePeriod1() + request.awayScorePeriod2() + request.awayScorePeriod3();
        int homeTotal = homeRegulation + request.homeScoreOt();
        int awayTotal = awayRegulation + request.awayScoreOt();

        if (homeTotal == awayTotal) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Playoff games cannot end in a tie.");
        }

        return homeTotal > awayTotal ? game.getHomeTeam() : game.getAwayTeam();
    }

    private record SeededTeam(Team team, int rank) {}
}
