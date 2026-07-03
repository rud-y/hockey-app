package com.rz.hockey.dto;

import com.rz.hockey.enums.CompetitionType;

public record GenerateFixturesRequest(
        CompetitionType competitionType,
        String seasonYear
) {}
