package com.rz.hockey.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class WeeklyFixture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private int weekNumber;

    @ManyToOne(optional = false)
    @JsonBackReference
    private LeagueTable leagueTable;

    @OneToMany(mappedBy = "weeklyFixture", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Match> matches = new ArrayList<>();

    public WeeklyFixture() {}

    public WeeklyFixture(int weekNumber, LeagueTable leagueTable) {
        this.weekNumber = weekNumber;
        this.leagueTable = leagueTable;
    }

    public Long getId() {
        return id;
    }

    public int getWeekNumber() {
        return weekNumber;
    }

    public LeagueTable getLeagueTable() {
        return leagueTable;
    }

    public List<Match> getMatches() {
        return matches;
    }

    public void setLeagueTable(LeagueTable leagueTable) {
        this.leagueTable = leagueTable;
    }

    public void addMatch(Match match) {
        matches.add(match);
        match.setWeeklyFixture(this);
    }
}
