package com.rz.hockey.entities;

import com.rz.hockey.enums.PeriodType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AssistEventTest {

    @Test
    void noArgConstructorLeavesFieldsAtDefaults() {
        AssistEvent event = new AssistEvent();

        assertEquals(0, event.getMinute());
        assertNull(event.getPeriod());
        assertNull(event.getAssist());
        assertNull(event.getTeam());
        assertNull(event.getMatch());
    }

    @Test
    void constructorSetsAssistFields() {
        Team team = new Team("Minnesota Wild", "MIN");
        Player assist = new Player("Kirill Kaprizov", team);
        Match match = new Match(team, new Team("St. Louis Blues", "STL"));

        AssistEvent event = new AssistEvent(22, PeriodType.FIRST, assist, team, match);

        assertEquals(22, event.getMinute());
        assertEquals(PeriodType.FIRST, event.getPeriod());
        assertSame(assist, event.getAssist());
        assertSame(team, event.getTeam());
        assertSame(match, event.getMatch());
    }

    @Test
    void settersUpdateAllMutableFields() {
        AssistEvent event = new AssistEvent();
        Team team = new Team("Nashville Predators", "NSH");
        Player assist = new Player("Roman Josi", team);
        Match match = new Match(team, new Team("Chicago Blackhawks", "CHI"));

        event.setMinute(55);
        event.setPeriod(PeriodType.THIRD);
        event.setAssist(assist);
        event.setTeam(team);
        event.setMatch(match);

        assertEquals(55, event.getMinute());
        assertEquals(PeriodType.THIRD, event.getPeriod());
        assertSame(assist, event.getAssist());
        assertSame(team, event.getTeam());
        assertSame(match, event.getMatch());
    }
}
