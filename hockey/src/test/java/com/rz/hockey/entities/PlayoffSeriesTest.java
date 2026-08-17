package com.rz.hockey.entities;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PlayoffSeriesTest {

    @Test
    void bestOfSevenConstantsAreFourWinsAndSevenGames() {
        assertEquals(4, PlayoffSeries.WINS_TO_ADVANCE);
        assertEquals(7, PlayoffSeries.MAX_GAMES);
    }

    @Test
    void noArgConstructorLeavesGamesListEmpty() {
        PlayoffSeries series = new PlayoffSeries();

        assertNull(series.getId());
        assertNotNull(series.getGames());
        assertTrue(series.getGames().isEmpty());
        assertFalse(series.isCompleted());
    }

    @Test
    void constructorSetsSeedsAndStartsSeriesUnplayed() {
        Team higher = new Team("Dallas Stars", "DAL");
        Team lower = new Team("Colorado Avalanche", "COL");

        PlayoffSeries series = new PlayoffSeries(2, 1, higher, lower, 2, 3);

        assertEquals(2, series.getRoundNumber());
        assertEquals(1, series.getSeriesIndex());
        assertSame(higher, series.getHigherSeedTeam());
        assertSame(lower, series.getLowerSeedTeam());
        assertEquals(2, series.getHigherSeedRank());
        assertEquals(3, series.getLowerSeedRank());
        assertEquals(0, series.getHigherSeedWins());
        assertEquals(0, series.getLowerSeedWins());
        assertFalse(series.isCompleted());
        assertNull(series.getWinner());
    }

    @Test
    void addGameStoresGameAndSetsBackReference() {
        Team higher = new Team("Dallas Stars", "DAL");
        Team lower = new Team("Colorado Avalanche", "COL");
        PlayoffSeries series = new PlayoffSeries(1, 0, higher, lower, 1, 8);
        PlayoffGame game = new PlayoffGame(1, higher, lower);

        series.addGame(game);

        assertEquals(1, series.getGames().size());
        assertSame(game, series.getGames().get(0));
        assertSame(series, game.getSeries());
    }

    @Test
    void settersUpdateWinsWinnerAndCompletion() {
        Team higher = new Team("Dallas Stars", "DAL");
        Team lower = new Team("Colorado Avalanche", "COL");
        PlayoffSeries series = new PlayoffSeries(1, 0, higher, lower, 1, 8);
        PlayoffBracket bracket = new PlayoffBracket("2025-26", 8, 3);

        series.setBracket(bracket);
        series.setHigherSeedWins(4);
        series.setLowerSeedWins(2);
        series.setWinner(higher);
        series.setCompleted(true);

        assertSame(bracket, series.getBracket());
        assertEquals(4, series.getHigherSeedWins());
        assertEquals(2, series.getLowerSeedWins());
        assertSame(higher, series.getWinner());
        assertTrue(series.isCompleted());
    }
}
