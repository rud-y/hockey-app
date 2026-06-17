package com.rz.hockey.entities;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Team homeTeam;

    @ManyToOne
    private Team awayTeam;

    @Column
    private boolean completed;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL)
    private List<GoalEvent> goals = new ArrayList<>();

    public Match() {}

    public Match(Team homeTeam, Team awayTeam, boolean completed) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.completed = completed;
    }

    public Team getHomeTeam() {
        return homeTeam;
    }

    public Team getAwayTeam() {
        return awayTeam;
    }

    public boolean isCompleted() {
        return completed;
    }

    public List<GoalEvent> getGoals() {
        return goals;
    }

    public void setHomeTeam(Team homeTeam) {
        this.homeTeam = homeTeam;
    }

    public void setAwayTeam(Team awayTeam) {
        this.awayTeam = awayTeam;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
