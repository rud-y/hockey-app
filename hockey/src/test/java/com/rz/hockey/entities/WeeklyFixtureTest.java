package com.rz.hockey.entities;

import com.rz.hockey.enums.CompetitionType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WeeklyFixtureTest {

    @Test
    void noArgConstructorLeavesMatchesListEmpty() {
        WeeklyFixture fixture = new WeeklyFixture();

        assertNull(fixture.getId());
        assertNotNull(fixture.getMatches());
        assertTrue(fixture.getMatches().isEmpty());
    }

    @Test
    void constructorSetsWeekNumberAndLeagueTable() {
        LeagueTable table = new LeagueTable(CompetitionType.REGULAR_SEASON, "2025-26");

        WeeklyFixture fixture = new WeeklyFixture(4, table);

        assertEquals(4, fixture.getWeekNumber());
        assertSame(table, fixture.getLeagueTable());
    }

    @Test
    void addMatchStoresMatchAndSetsBackReference() {
        LeagueTable table = new LeagueTable(CompetitionType.REGULAR_SEASON, "2025-26");
        WeeklyFixture fixture = new WeeklyFixture(1, table);
        Match match = new Match(
                new Team("Anaheim Ducks", "ANA"),
                new Team("San Jose Sharks", "SJS"));

        fixture.addMatch(match);

        assertEquals(1, fixture.getMatches().size());
        assertSame(match, fixture.getMatches().get(0));
        assertSame(fixture, match.getWeeklyFixture());
    }

    @Test
    void setLeagueTableUpdatesAssociation() {
        WeeklyFixture fixture = new WeeklyFixture();
        LeagueTable table = new LeagueTable(CompetitionType.REGULAR_SEASON, "2025-26");

        fixture.setLeagueTable(table);

        assertSame(table, fixture.getLeagueTable());
    }
}
