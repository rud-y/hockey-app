package com.rz.hockey.entities;

import com.rz.hockey.enums.PeriodType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PlayoffGameTest {

    @Test
    void noArgConstructorLeavesGoalsListEmpty() {
        PlayoffGame game = new PlayoffGame();

        assertNull(game.getId());
        assertNotNull(game.getGoals());
        assertTrue(game.getGoals().isEmpty());
        assertFalse(game.isCompleted());
    }

    @Test
    void constructorSetsGameNumberTeamsAndMarksIncomplete() {
        Team home = new Team("Edmonton Oilers", "EDM");
        Team away = new Team("Vegas Golden Knights", "VGK");

        PlayoffGame game = new PlayoffGame(3, home, away);

        assertEquals(3, game.getGameNumber());
        assertSame(home, game.getHomeTeam());
        assertSame(away, game.getAwayTeam());
        assertFalse(game.isCompleted());
    }

    @Test
    void addGoalStoresEventAndSetsPlayoffBackReference() {
        Team home = new Team("Edmonton Oilers", "EDM");
        Team away = new Team("Vegas Golden Knights", "VGK");
        PlayoffGame game = new PlayoffGame(1, home, away);
        Player scorer = new Player("Connor McDavid", home);

        GoalEvent goal = GoalEvent.forPlayoff(9, PeriodType.FIRST, scorer, null, home, game);
        game.addGoal(goal);

        assertEquals(1, game.getGoals().size());
        assertSame(goal, game.getGoals().get(0));
        assertSame(game, goal.getPlayoffGame());
    }

    @Test
    void settersUpdateSeriesCompletionAndPeriodScores() {
        Team home = new Team("Edmonton Oilers", "EDM");
        Team away = new Team("Vegas Golden Knights", "VGK");
        PlayoffGame game = new PlayoffGame(2, home, away);
        PlayoffSeries series = new PlayoffSeries(1, 0, home, away, 1, 8);

        game.setSeries(series);
        game.setCompleted(true);
        game.setHomeScorePeriod1(2);
        game.setAwayScorePeriod1(1);
        game.setHomeScorePeriod2(0);
        game.setAwayScorePeriod2(1);
        game.setHomeScorePeriod3(1);
        game.setAwayScorePeriod3(0);
        game.setHomeScoreOt(0);
        game.setAwayScoreOt(1);

        assertSame(series, game.getSeries());
        assertTrue(game.isCompleted());
        assertEquals(2, game.getHomeScorePeriod1());
        assertEquals(1, game.getAwayScorePeriod1());
        assertEquals(0, game.getHomeScorePeriod2());
        assertEquals(1, game.getAwayScorePeriod2());
        assertEquals(1, game.getHomeScorePeriod3());
        assertEquals(0, game.getAwayScorePeriod3());
        assertEquals(0, game.getHomeScoreOt());
        assertEquals(1, game.getAwayScoreOt());
    }
}
