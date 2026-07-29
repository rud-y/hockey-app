package com.rz.hockey.dto;

import java.util.List;

public record MatchResultRequest(
        int homeScorePeriod1,
        int awayScorePeriod1,
        int homeScorePeriod2,
        int awayScorePeriod2,
        int homeScorePeriod3,
        int awayScorePeriod3,
        int homeScoreOt,
        int awayScoreOt,
        List<GoalEventRequest> goals
) {
    public MatchResultRequest {
        if (goals == null) {
            goals = List.of();
        }
    }
}
