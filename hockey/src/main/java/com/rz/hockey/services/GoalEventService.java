package com.rz.hockey.services;

import com.rz.hockey.dto.GoalEventRequest;
import com.rz.hockey.entities.GoalEvent;
import com.rz.hockey.entities.Match;
import com.rz.hockey.entities.Player;
import com.rz.hockey.entities.PlayoffGame;
import com.rz.hockey.entities.Team;
import com.rz.hockey.enums.PeriodType;
import com.rz.hockey.repositories.PlayerRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GoalEventService {

    private final PlayerRepository playerRepository;

    public GoalEventService(PlayerRepository playerRepository) {
        this.playerRepository = playerRepository;
    }

    public void attachGoalsToMatch(Match match, List<GoalEventRequest> requests) {
        match.getGoals().clear();
        List<GoalEventRequest> events = requests == null || requests.isEmpty()
                ? generateForScores(
                        match.getHomeTeam(),
                        match.getAwayTeam(),
                        match.getHomeScorePeriod1(),
                        match.getAwayScorePeriod1(),
                        match.getHomeScorePeriod2(),
                        match.getAwayScorePeriod2(),
                        match.getHomeScorePeriod3(),
                        match.getAwayScorePeriod3(),
                        match.getHomeScoreOt(),
                        match.getAwayScoreOt())
                : requests;

        for (GoalEventRequest request : events) {
            Team team = resolveTeam(match.getHomeTeam(), match.getAwayTeam(), request.teamId());
            Player scorer = requirePlayer(request.scorerId(), team);
            Player assist = request.assistId() == null ? null : requirePlayer(request.assistId(), team);
            match.addGoal(new GoalEvent(request.minute(), request.period(), scorer, assist, team, match));
        }
    }

    public void attachGoalsToPlayoffGame(PlayoffGame game, List<GoalEventRequest> requests) {
        game.getGoals().clear();
        List<GoalEventRequest> events = requests == null || requests.isEmpty()
                ? generateForScores(
                        game.getHomeTeam(),
                        game.getAwayTeam(),
                        game.getHomeScorePeriod1(),
                        game.getAwayScorePeriod1(),
                        game.getHomeScorePeriod2(),
                        game.getAwayScorePeriod2(),
                        game.getHomeScorePeriod3(),
                        game.getAwayScorePeriod3(),
                        game.getHomeScoreOt(),
                        game.getAwayScoreOt())
                : requests;

        for (GoalEventRequest request : events) {
            Team team = resolveTeam(game.getHomeTeam(), game.getAwayTeam(), request.teamId());
            Player scorer = requirePlayer(request.scorerId(), team);
            Player assist = request.assistId() == null ? null : requirePlayer(request.assistId(), team);
            game.addGoal(GoalEvent.forPlayoff(
                    request.minute(), request.period(), scorer, assist, team, game));
        }
    }

    public List<GoalEventRequest> generateForScores(
            Team homeTeam,
            Team awayTeam,
            int homeP1,
            int awayP1,
            int homeP2,
            int awayP2,
            int homeP3,
            int awayP3,
            int homeOt,
            int awayOt) {
        List<GoalEventRequest> events = new ArrayList<>();
        events.addAll(generatePeriodGoals(homeTeam, PeriodType.FIRST, homeP1));
        events.addAll(generatePeriodGoals(awayTeam, PeriodType.FIRST, awayP1));
        events.addAll(generatePeriodGoals(homeTeam, PeriodType.SECOND, homeP2));
        events.addAll(generatePeriodGoals(awayTeam, PeriodType.SECOND, awayP2));
        events.addAll(generatePeriodGoals(homeTeam, PeriodType.THIRD, homeP3));
        events.addAll(generatePeriodGoals(awayTeam, PeriodType.THIRD, awayP3));
        events.addAll(generatePeriodGoals(homeTeam, PeriodType.OVERTIME, homeOt));
        events.addAll(generatePeriodGoals(awayTeam, PeriodType.OVERTIME, awayOt));
        return events;
    }

    private List<GoalEventRequest> generatePeriodGoals(Team team, PeriodType period, int goalCount) {
        if (goalCount <= 0) {
            return List.of();
        }

        List<Player> players = loadPlayers(team);
        if (players.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Team " + team.getShortName() + " has no players to assign goals.");
        }

        List<GoalEventRequest> events = new ArrayList<>();
        for (int i = 0; i < goalCount; i++) {
            Player scorer = players.get(ThreadLocalRandom.current().nextInt(players.size()));
            Player assist = null;
            if (players.size() > 1) {
                List<Player> others = new ArrayList<>(players);
                others.remove(scorer);
                assist = others.get(ThreadLocalRandom.current().nextInt(others.size()));
            }
            int minute = 1 + ThreadLocalRandom.current().nextInt(20);
            events.add(new GoalEventRequest(
                    period,
                    team.getId(),
                    scorer.getId(),
                    assist == null ? null : assist.getId(),
                    minute));
        }
        return events;
    }

    private List<Player> loadPlayers(Team team) {
        if (team.getPlayers() != null && !team.getPlayers().isEmpty()) {
            return team.getPlayers();
        }
        return playerRepository.findByTeam_Id(team.getId());
    }

    private Team resolveTeam(Team home, Team away, Long teamId) {
        if (home.getId().equals(teamId)) {
            return home;
        }
        if (away.getId().equals(teamId)) {
            return away;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Goal team does not play in this match.");
    }

    private Player requirePlayer(Long playerId, Team team) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Player not found: " + playerId));
        if (player.getTeam() == null || !player.getTeam().getId().equals(team.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Player does not belong to scoring team.");
        }
        return player;
    }
}
