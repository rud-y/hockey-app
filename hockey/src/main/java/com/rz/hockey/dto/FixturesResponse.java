package com.rz.hockey.dto;

import com.rz.hockey.entities.WeeklyFixture;

import java.util.List;

public record FixturesResponse(
        int activeWeekNumber,
        int totalWeeks,
        List<WeeklyFixture> fixtures
) {}
