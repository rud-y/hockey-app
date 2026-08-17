package com.rz.hockey.entities;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PlayerTest {

    @Test
    void noArgConstructorLeavesFieldsUnset() {
        Player player = new Player();

        assertNull(player.getId());
        assertNull(player.getName());
        assertNull(player.getTeam());
    }

    @Test
    void constructorSetsNameAndTeam() {
        Team team = new Team("Colorado Avalanche", "COL");
        Player player = new Player("Nathan MacKinnon", team);

        assertEquals("Nathan MacKinnon", player.getName());
        assertSame(team, player.getTeam());
    }

    @Test
    void settersUpdateNameAndTeam() {
        Team original = new Team("Dallas Stars", "DAL");
        Team next = new Team("Vegas Golden Knights", "VGK");
        Player player = new Player("Jason Robertson", original);

        player.setName("Jack Eichel");
        player.setTeam(next);

        assertEquals("Jack Eichel", player.getName());
        assertSame(next, player.getTeam());
    }
}
