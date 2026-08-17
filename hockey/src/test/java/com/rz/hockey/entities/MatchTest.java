package com.rz.hockey.entities;

import com.rz.hockey.enums.PeriodType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class MatchTest {

    @Test
    void noArgConstructorLeavesGoalsListEmpty() {
        Match match = new Match();

        assertNull(match.getId());
        assertNotNull(match.getGoals());
        assertTrue(match.getGoals().isEmpty());
        assertFalse(match.isCompleted());
    }

    @Test
    void constructorSetsTeamsAndMarksMatchIncomplete() {
        Team home = new Team("New York Rangers", "NYR");
        Team away = new Team("New Jersey Devils", "NJD");

        Match match = new Match(home, away);

        assertSame(home, match.getHomeTeam());
        assertSame(away, match.getAwayTeam());
        assertFalse(match.isCompleted());
    }

    @Test
    void addGoalStoresEventAndSetsBackReference() {
        Team home = new Team("Tampa Bay Lightning", "TBL");
        Team away = new Team("Florida Panthers", "FLA");
        Match match = new Match(home, away);
        Player scorer = new Player("Nikita Kucherov", home);

        GoalEvent goal = new GoalEvent(12, PeriodType.FIRST, scorer, null, home, match);
        match.addGoal(goal);

        assertEquals(1, match.getGoals().size());
        assertSame(goal, match.getGoals().get(0));
        assertSame(match, goal.getMatch());
    }

    @Test
    void settersUpdateTeamsFixtureCompletionAndPeriodScores() {
        Team home = new Team("Pittsburgh Penguins", "PIT");
        Team away = new Team("Washington Capitals", "WSH");
        Match match = new Match(home, away);
        WeeklyFixture fixture = new WeeklyFixture(3, new LeagueTable());

        Team newHome = new Team("Carolina Hurricanes", "CAR");
        Team newAway = new Team("Columbus Blue Jackets", "CBJ");

        match.setHomeTeam(newHome);
        match.setAwayTeam(newAway);
        match.setWeeklyFixture(fixture);
        match.setCompleted(true);
        match.setHomeScorePeriod1(1);
        match.setAwayScorePeriod1(0);
        match.setHomeScorePeriod2(2);
        match.setAwayScorePeriod2(1);
        match.setHomeScorePeriod3(0);
        match.setAwayScorePeriod3(2);
        match.setHomeScoreOt(1);
        match.setAwayScoreOt(0);

        assertSame(newHome, match.getHomeTeam());
        assertSame(newAway, match.getAwayTeam());
        assertSame(fixture, match.getWeeklyFixture());
        assertTrue(match.isCompleted());
        assertEquals(1, match.getHomeScorePeriod1());
        assertEquals(0, match.getAwayScorePeriod1());
        assertEquals(2, match.getHomeScorePeriod2());
        assertEquals(1, match.getAwayScorePeriod2());
        assertEquals(0, match.getHomeScorePeriod3());
        assertEquals(2, match.getAwayScorePeriod3());
        assertEquals(1, match.getHomeScoreOt());
        assertEquals(0, match.getAwayScoreOt());
    }
}
