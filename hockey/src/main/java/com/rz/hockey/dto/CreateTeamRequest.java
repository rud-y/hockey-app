package com.rz.hockey.dto;

import com.rz.hockey.enums.CompetitionType;

import java.util.List;

public record CreateTeamRequest(
        String name,
        String shortName,
        List<String> playerNames,
        CompetitionType competitionType,
        String seasonYear
) {}
