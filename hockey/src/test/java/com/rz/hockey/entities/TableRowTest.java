package com.rz.hockey.entities;

import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.enums.StreakType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TableRowTest {

    @Test
    void noArgConstructorLeavesNumericFieldsAtZero() {
        TableRow row = new TableRow();

        assertNull(row.getId());
        assertEquals(0, row.getGamesPlayed());
        assertEquals(0, row.getWins());
        assertEquals(0, row.getPoints());
    }

    @Test
    void constructorSetsStandingsFieldsAndZeroesGoals() {
        Team team = new Team("Vancouver Canucks", "VAN");
        LeagueTable table = new LeagueTable(CompetitionType.REGULAR_SEASON, "2025-26");

        TableRow row = new TableRow(team, table, 10, 6, 3, 1, 13, StreakType.W, 2);

        assertSame(team, row.getTeam());
        assertSame(table, row.getLeagueTable());
        assertEquals(10, row.getGamesPlayed());
        assertEquals(10, row.getNumberOfGames());
        assertEquals(6, row.getWins());
        assertEquals(3, row.getLosses());
        assertEquals(1, row.getOtLosses());
        assertEquals(13, row.getPoints());
        assertEquals(0, row.getGoalsFor());
        assertEquals(0, row.getGoalsAgainst());
        assertEquals(StreakType.W, row.getStreak());
        assertEquals(2, row.getStreakCount());
    }

    @Test
    void setGamesPlayedUpdatesValueAndReturnsIt() {
        TableRow row = new TableRow();

        int returned = row.setGamesPlayed(14);

        assertEquals(14, returned);
        assertEquals(14, row.getGamesPlayed());
        assertEquals(14, row.getNumberOfGames());
    }

    @Test
    void addMatchGoalsAccumulatesScoredAndConceded() {
        TableRow row = new TableRow();

        row.addMatchGoals(3, 1);
        row.addMatchGoals(2, 4);

        assertEquals(5, row.getGoalsFor());
        assertEquals(5, row.getGoalsAgainst());
    }

    @Test
    void settersUpdateStandingsFields() {
        TableRow row = new TableRow();
        Team team = new Team("Los Angeles Kings", "LAK");
        LeagueTable table = new LeagueTable(CompetitionType.REGULAR_SEASON, "2025-26");

        row.setTeam(team);
        row.setLeagueTable(table);
        row.setWins(8);
        row.setLosses(4);
        row.setOtLosses(2);
        row.setPoints(18);
        row.setGoalsFor(31);
        row.setGoalsAgainst(22);
        row.setStreak(StreakType.L);
        row.setStreakCount(3);

        assertSame(team, row.getTeam());
        assertSame(table, row.getLeagueTable());
        assertEquals(8, row.getWins());
        assertEquals(4, row.getLosses());
        assertEquals(2, row.getOtLosses());
        assertEquals(18, row.getPoints());
        assertEquals(31, row.getGoalsFor());
        assertEquals(22, row.getGoalsAgainst());
        assertEquals(StreakType.L, row.getStreak());
        assertEquals(3, row.getStreakCount());
    }
}
