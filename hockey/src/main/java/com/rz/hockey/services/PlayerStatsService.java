package com.rz.hockey.services;

import com.rz.hockey.dto.PlayerStatsResponse;
import com.rz.hockey.entities.GoalEvent;
import com.rz.hockey.entities.Player;
import com.rz.hockey.entities.Team;
import com.rz.hockey.repositories.GoalEventRepository;
import com.rz.hockey.repositories.PlayerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PlayerStatsService {

    private final GoalEventRepository goalEventRepository;
    private final PlayerRepository playerRepository;

    public PlayerStatsService(
            GoalEventRepository goalEventRepository,
            PlayerRepository playerRepository) {
        this.goalEventRepository = goalEventRepository;
        this.playerRepository = playerRepository;
    }

    public List<PlayerStatsResponse> getSeasonPlayerStats(String seasonYear) {
        Map<Long, MutableStats> statsByPlayer = new HashMap<>();

        for (Player player : playerRepository.findAll()) {
            statsByPlayer.put(player.getId(), new MutableStats(player));
        }

        for (GoalEvent goal : goalEventRepository.findAllForSeason(seasonYear)) {
            if (goal.getScorer() != null) {
                statsByPlayer
                        .computeIfAbsent(goal.getScorer().getId(), id -> new MutableStats(goal.getScorer()))
                        .goals += 1;
            }
            if (goal.getAssist() != null) {
                statsByPlayer
                        .computeIfAbsent(goal.getAssist().getId(), id -> new MutableStats(goal.getAssist()))
                        .assists += 1;
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
