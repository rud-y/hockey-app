package com.rz.hockey.services;

import com.rz.hockey.dto.PlayerStatsResponse;
import com.rz.hockey.entities.GoalEvent;
import com.rz.hockey.entities.Player;
import com.rz.hockey.entities.PlayoffBracket;
import com.rz.hockey.entities.PlayoffSeries;
import com.rz.hockey.entities.Team;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.repositories.GoalEventRepository;
import com.rz.hockey.repositories.PlayerRepository;
import com.rz.hockey.repositories.PlayoffBracketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PlayerStatsService {

    private final GoalEventRepository goalEventRepository;
    private final PlayerRepository playerRepository;
    private final PlayoffBracketRepository playoffBracketRepository;

    public PlayerStatsService(
            GoalEventRepository goalEventRepository,
            PlayerRepository playerRepository,
            PlayoffBracketRepository playoffBracketRepository) {
        this.goalEventRepository = goalEventRepository;
        this.playerRepository = playerRepository;
        this.playoffBracketRepository = playoffBracketRepository;
    }

    public List<PlayerStatsResponse> getSeasonPlayerStats(String seasonYear, CompetitionType competitionType) {
        if (competitionType != CompetitionType.REGULAR_SEASON && competitionType != CompetitionType.PLAYOFF) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "competitionType must be REGULAR_SEASON or PLAYOFF.");
        }

        Map<Long, MutableStats> statsByPlayer = new HashMap<>();

        if (competitionType == CompetitionType.PLAYOFF) {
            Set<Long> playoffTeamIds = resolvePlayoffTeamIds(seasonYear);
            if (playoffTeamIds.isEmpty()) {
                return List.of();
            }
            for (Player player : playerRepository.findAll()) {
                Team team = player.getTeam();
                if (team != null && playoffTeamIds.contains(team.getId())) {
                    statsByPlayer.put(player.getId(), new MutableStats(player));
                }
            }
        } else {
            for (Player player : playerRepository.findAll()) {
                statsByPlayer.put(player.getId(), new MutableStats(player));
            }
        }

        List<GoalEvent> goals = competitionType == CompetitionType.PLAYOFF
                ? goalEventRepository.findAllForPlayoffs(seasonYear)
                : goalEventRepository.findAllForRegularSeason(seasonYear);

        for (GoalEvent goal : goals) {
            if (goal.getScorer() != null && statsByPlayer.containsKey(goal.getScorer().getId())) {
                statsByPlayer.get(goal.getScorer().getId()).goals += 1;
            }
            if (goal.getAssist() != null && statsByPlayer.containsKey(goal.getAssist().getId())) {
                statsByPlayer.get(goal.getAssist().getId()).assists += 1;
            }
        }

        List<PlayerStatsResponse> results = new ArrayList<>();
        for (MutableStats stats : statsByPlayer.values()) {
            results.add(stats.toResponse());
        }

        results.sort(Comparator
                .comparingInt(PlayerStatsResponse::points).reversed()
                .thenComparingInt(PlayerStatsResponse::goals).reversed()
                .thenComparingInt(PlayerStatsResponse::assists).reversed()
                .thenComparing(PlayerStatsResponse::playerName));

        return results;
    }

    private Set<Long> resolvePlayoffTeamIds(String seasonYear) {
        return playoffBracketRepository.findBySeasonYear(seasonYear)
                .map(this::teamIdsFromBracket)
                .orElse(Set.of());
    }

    private Set<Long> teamIdsFromBracket(PlayoffBracket bracket) {
        Set<Long> teamIds = new HashSet<>();
        for (PlayoffSeries series : bracket.getSeries()) {
            if (series.getRoundNumber() != 1) {
                continue;
            }
            if (series.getHigherSeedTeam() != null) {
                teamIds.add(series.getHigherSeedTeam().getId());
            }
            if (series.getLowerSeedTeam() != null) {
                teamIds.add(series.getLowerSeedTeam().getId());
            }
        }
        return teamIds;
    }

    private static final class MutableStats {
        private final Player player;
        private int goals;
        private int assists;

        private MutableStats(Player player) {
            this.player = player;
        }

        private PlayerStatsResponse toResponse() {
            Team team = player.getTeam();
            return new PlayerStatsResponse(
                    player.getId(),
                    player.getName(),
                    team == null ? null : team.getId(),
                    team == null ? "" : team.getName(),
                    team == null ? "" : team.getShortName(),
                    goals,
                    assists,
                    goals + assists);
        }
    }
}
