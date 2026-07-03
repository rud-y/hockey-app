package com.rz.hockey.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties({"players", "hibernateLazyInitializer", "handler"})
    private Team homeTeam;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties({"players", "hibernateLazyInitializer", "handler"})
    private Team awayTeam;

    @ManyToOne(optional = false)
    @JsonBackReference
    private WeeklyFixture weeklyFixture;

    @Column
    private boolean completed;

    @Column
    private int homeScorePeriod1;

    @Column
    private int awayScorePeriod1;

    @Column
    private int homeScorePeriod2;

    @Column
    private int awayScorePeriod2;

    @Column
    private int homeScorePeriod3;

    @Column
    private int awayScorePeriod3;

    @Column
    private int homeScoreOt;

    @Column
    private int awayScoreOt;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("match")
    private List<GoalEvent> goals = new ArrayList<>();

    public Match() {}

    public Match(Team homeTeam, Team awayTeam) {
        this.homeTeam = homeTeam;
        this.awayTeam = awayTeam;
        this.completed = false;
    }

    public Long getId() {
        return id;
    }

    public Team getHomeTeam() {
        return homeTeam;
    }

    public Team getAwayTeam() {
        return awayTeam;
    }

    public WeeklyFixture getWeeklyFixture() {
        return weeklyFixture;
    }

    public boolean isCompleted() {
        return completed;
    }

    public int getHomeScorePeriod1() {
        return homeScorePeriod1;
    }

    public int getAwayScorePeriod1() {
        return awayScorePeriod1;
    }

    public int getHomeScorePeriod2() {
        return homeScorePeriod2;
    }

    public int getAwayScorePeriod2() {
        return awayScorePeriod2;
    }

    public int getHomeScorePeriod3() {
        return homeScorePeriod3;
    }

    public int getAwayScorePeriod3() {
        return awayScorePeriod3;
    }

    public int getHomeScoreOt() {
        return homeScoreOt;
    }

    public int getAwayScoreOt() {
        return awayScoreOt;
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

    public void setWeeklyFixture(WeeklyFixture weeklyFixture) {
        this.weeklyFixture = weeklyFixture;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public void setHomeScorePeriod1(int homeScorePeriod1) {
        this.homeScorePeriod1 = homeScorePeriod1;
    }

    public void setAwayScorePeriod1(int awayScorePeriod1) {
        this.awayScorePeriod1 = awayScorePeriod1;
    }

    public void setHomeScorePeriod2(int homeScorePeriod2) {
        this.homeScorePeriod2 = homeScorePeriod2;
    }

    public void setAwayScorePeriod2(int awayScorePeriod2) {
        this.awayScorePeriod2 = awayScorePeriod2;
    }

    public void setHomeScorePeriod3(int homeScorePeriod3) {
        this.homeScorePeriod3 = homeScorePeriod3;
    }

    public void setAwayScorePeriod3(int awayScorePeriod3) {
        this.awayScorePeriod3 = awayScorePeriod3;
    }

    public void setHomeScoreOt(int homeScoreOt) {
        this.homeScoreOt = homeScoreOt;
    }

    public void setAwayScoreOt(int awayScoreOt) {
        this.awayScoreOt = awayScoreOt;
    }
}
