package com.rz.hockey.entities;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TeamTest {

    @Test
    void noArgConstructorLeavesPlayersListEmpty() {
        Team team = new Team();

        assertNull(team.getId());
        assertNotNull(team.getPlayers());
        assertTrue(team.getPlayers().isEmpty());
    }

    @Test
    void constructorSetsNameAndZeroesGoals() {
        Team team = new Team("Boston Bruins", "BOS");

        assertEquals("Boston Bruins", team.getName());
        assertEquals("BOS", team.getShortName());
        assertEquals(0, team.getGoalsFor());
        assertEquals(0, team.getGoalsAgainst());
    }

    @Test
    void settersUpdateNameAndGoalTotals() {
        Team team = new Team();

        team.setName("Toronto Maple Leafs");
        team.setShortName("TOR");
        team.setGoalsFor(12);
        team.setGoalsAgainst(8);

        assertEquals("Toronto Maple Leafs", team.getName());
        assertEquals("TOR", team.getShortName());
        assertEquals(12, team.getGoalsFor());
        assertEquals(8, team.getGoalsAgainst());
    }

    @Test
    void addPlayerAppendsToRoster() {
        Team team = new Team("Montreal Canadiens", "MTL");
        Player player = new Player("Nick Suzuki", team);

        team.addPlayer(player);

        assertEquals(1, team.getPlayers().size());
        assertSame(player, team.getPlayers().get(0));
    }

    @Test
    void addMatchGoalsAccumulatesScoredAndConceded() {
        Team team = new Team("Edmonton Oilers", "EDM");

        team.addMatchGoals(4, 2);
        team.addMatchGoals(1, 3);

        assertEquals(5, team.getGoalsFor());
        assertEquals(5, team.getGoalsAgainst());
    }
}
