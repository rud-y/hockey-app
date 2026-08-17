package com.rz.hockey.entities;

import com.rz.hockey.enums.PeriodType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GoalEventTest {

    @Test
    void noArgConstructorLeavesAssociationsUnset() {
        GoalEvent event = new GoalEvent();

        assertNull(event.getId());
        assertEquals(0, event.getMinute());
        assertNull(event.getPeriod());
        assertNull(event.getScorer());
        assertNull(event.getAssist());
        assertNull(event.getTeam());
        assertNull(event.getMatch());
        assertNull(event.getPlayoffGame());
    }

    @Test
    void constructorSetsRegularSeasonGoalFields() {
        Team team = new Team("Calgary Flames", "CGY");
        Player scorer = new Player("Nazem Kadri", team);
        Player assist = new Player("Jonathan Huberdeau", team);
        Match match = new Match(team, new Team("Winnipeg Jets", "WPG"));

        GoalEvent event = new GoalEvent(18, PeriodType.SECOND, scorer, assist, team, match);

        assertEquals(18, event.getMinute());
        assertEquals(PeriodType.SECOND, event.getPeriod());
        assertSame(scorer, event.getScorer());
        assertSame(assist, event.getAssist());
        assertSame(team, event.getTeam());
        assertSame(match, event.getMatch());
        assertNull(event.getPlayoffGame());
    }

    @Test
    void forPlayoffCreatesEventLinkedToPlayoffGameNotMatch() {
        Team team = new Team("New York Islanders", "NYI");
        Player scorer = new Player("Bo Horvat", team);
        Player assist = new Player("Mathew Barzal", team);
        PlayoffGame playoffGame = new PlayoffGame(1, team, new Team("Boston Bruins", "BOS"));

        GoalEvent event = GoalEvent.forPlayoff(
                7,
                PeriodType.OVERTIME,
                scorer,
                assist,
                team,
                playoffGame);

        assertEquals(7, event.getMinute());
        assertEquals(PeriodType.OVERTIME, event.getPeriod());
        assertSame(scorer, event.getScorer());
        assertSame(assist, event.getAssist());
        assertSame(team, event.getTeam());
        assertSame(playoffGame, event.getPlayoffGame());
        assertNull(event.getMatch());
    }

    @Test
    void settersUpdateAllMutableFields() {
        GoalEvent event = new GoalEvent();
        Team team = new Team("Ottawa Senators", "OTT");
        Player scorer = new Player("Brady Tkachuk", team);
        Player assist = new Player("Tim Stutzle", team);
        Match match = new Match(team, new Team("Buffalo Sabres", "BUF"));
        PlayoffGame playoffGame = new PlayoffGame(2, team, new Team("Toronto Maple Leafs", "TOR"));

        event.setMinute(41);
        event.setPeriod(PeriodType.THIRD);
        event.setScorer(scorer);
        event.setAssist(assist);
        event.setTeam(team);
        event.setMatch(match);
        event.setPlayoffGame(playoffGame);

        assertEquals(41, event.getMinute());
        assertEquals(PeriodType.THIRD, event.getPeriod());
        assertSame(scorer, event.getScorer());
        assertSame(assist, event.getAssist());
        assertSame(team, event.getTeam());
        assertSame(match, event.getMatch());
        assertSame(playoffGame, event.getPlayoffGame());
    }
}
