package com.rz.hockey.dto;

import com.rz.hockey.enums.CompetitionType;

public record SeasonRequest(
        CompetitionType competitionType,
        String seasonYear
) {}
