package com.rz.hockey.dto;

import com.rz.hockey.enums.PeriodType;

public record GoalEventRequest(
        PeriodType period,
        Long teamId,
        Long scorerId,
        Long assistId,
        int minute
) {}
