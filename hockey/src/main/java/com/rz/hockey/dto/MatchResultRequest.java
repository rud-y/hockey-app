package com.rz.hockey.dto;

public record MatchResultRequest(
        int homeScorePeriod1,
        int awayScorePeriod1,
        int homeScorePeriod2,
        int awayScorePeriod2,
        int homeScorePeriod3,
        int awayScorePeriod3,
        int homeScoreOt,
        int awayScoreOt
) {}
