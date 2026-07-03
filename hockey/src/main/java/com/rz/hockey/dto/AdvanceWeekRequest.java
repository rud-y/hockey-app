package com.rz.hockey.dto;

import com.rz.hockey.enums.CompetitionType;

public record AdvanceWeekRequest(
        CompetitionType competitionType,
        String seasonYear
) {}
