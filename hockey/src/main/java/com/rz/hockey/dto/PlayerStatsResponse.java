package com.rz.hockey.dto;

public record PlayerStatsResponse(
        Long playerId,
        String playerName,
        Long teamId,
        String teamName,
        String teamShortName,
        int goals,
        int assists,
        int points
) {}
