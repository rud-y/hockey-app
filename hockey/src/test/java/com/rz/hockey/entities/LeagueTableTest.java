package com.rz.hockey.entities;

import com.rz.hockey.enums.CompetitionType;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LeagueTableTest {

    @Test
    void noArgConstructorDefaultsActiveWeekToOne() {
        LeagueTable table = new LeagueTable();

        assertNull(table.getId());
        assertEquals(1, table.getActiveWeekNumber());
        assertNull(table.getRows());
    }

    @Test
    void constructorSetsCompetitionAndSeason() {
        LeagueTable table = new LeagueTable(CompetitionType.REGULAR_SEASON, "2025-26");

        assertEquals(CompetitionType.REGULAR_SEASON, table.getCompetitionType());
        assertEquals("2025-26", table.getSeasonYear());
        assertEquals(1, table.getActiveWeekNumber());
    }

    @Test
    void constructorWithRowsStoresProvidedList() {
        List<TableRow> rows = new ArrayList<>();
        LeagueTable table = new LeagueTable(rows, CompetitionType.PLAYOFF, "2024-25");

        assertSame(rows, table.getRows());
        assertEquals(CompetitionType.PLAYOFF, table.getCompetitionType());
        assertEquals("2024-25", table.getSeasonYear());
    }

    @Test
    void addRowCreatesListWhenNullAndSetsBackReference() {
        LeagueTable table = new LeagueTable(CompetitionType.REGULAR_SEASON, "2025-26");
        Team team = new Team("Seattle Kraken", "SEA");
        TableRow row = new TableRow();
        row.setTeam(team);

        table.addRow(row);

        assertEquals(1, table.getRows().size());
        assertSame(row, table.getRows().get(0));
        assertSame(table, row.getLeagueTable());
    }

    @Test
    void settersUpdateWeekCompetitionSeasonAndRows() {
        LeagueTable table = new LeagueTable();
        List<TableRow> rows = new ArrayList<>();

        table.setActiveWeekNumber(6);
        table.setCompetitionType(CompetitionType.REGULAR_SEASON);
        table.setSeasonYear("2026-27");
        table.setRows(rows);

        assertEquals(6, table.getActiveWeekNumber());
        assertEquals(CompetitionType.REGULAR_SEASON, table.getCompetitionType());
        assertEquals("2026-27", table.getSeasonYear());
        assertSame(rows, table.getRows());
    }
}
