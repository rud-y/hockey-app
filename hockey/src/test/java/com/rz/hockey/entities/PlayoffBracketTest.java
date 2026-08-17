package com.rz.hockey.entities;

import com.rz.hockey.enums.PlayoffStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PlayoffBracketTest {

    @Test
    void noArgConstructorDefaultsStatusAndRound() {
        PlayoffBracket bracket = new PlayoffBracket();

        assertNull(bracket.getId());
        assertEquals(PlayoffStatus.IN_PROGRESS, bracket.getStatus());
        assertEquals(1, bracket.getCurrentRound());
        assertNotNull(bracket.getSeries());
        assertTrue(bracket.getSeries().isEmpty());
    }

    @Test
    void constructorSetsSeasonSizeAndStartsRoundOneInProgress() {
        PlayoffBracket bracket = new PlayoffBracket("2025-26", 8, 3);

        assertEquals("2025-26", bracket.getSeasonYear());
        assertEquals(8, bracket.getPlayoffTeamCount());
        assertEquals(3, bracket.getTotalRounds());
        assertEquals(PlayoffStatus.IN_PROGRESS, bracket.getStatus());
        assertEquals(1, bracket.getCurrentRound());
        assertNull(bracket.getChampion());
    }

    @Test
    void addSeriesStoresSeriesAndSetsBackReference() {
        PlayoffBracket bracket = new PlayoffBracket("2025-26", 8, 3);
        Team higher = new Team("Detroit Red Wings", "DET");
        Team lower = new Team("Philadelphia Flyers", "PHI");
        PlayoffSeries series = new PlayoffSeries(1, 0, higher, lower, 1, 8);

        bracket.addSeries(series);

        assertEquals(1, bracket.getSeries().size());
        assertSame(series, bracket.getSeries().get(0));
        assertSame(bracket, series.getBracket());
    }

    @Test
    void settersUpdateStatusRoundAndChampion() {
        PlayoffBracket bracket = new PlayoffBracket("2025-26", 8, 3);
        Team champion = new Team("Detroit Red Wings", "DET");

        bracket.setStatus(PlayoffStatus.COMPLETED);
        bracket.setCurrentRound(3);
        bracket.setChampion(champion);

        assertEquals(PlayoffStatus.COMPLETED, bracket.getStatus());
        assertEquals(3, bracket.getCurrentRound());
        assertSame(champion, bracket.getChampion());
    }
}
