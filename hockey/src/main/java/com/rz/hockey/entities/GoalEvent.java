package com.rz.hockey.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.rz.hockey.enums.PeriodType;
import jakarta.persistence.*;

@Entity
public class GoalEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "goal_minute")
    private int minute;

    @Enumerated(EnumType.STRING)
    private PeriodType period;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties({"team", "hibernateLazyInitializer", "handler"})
    private Player scorer;

    @ManyToOne
    @JsonIgnoreProperties({"team", "hibernateLazyInitializer", "handler"})
    private Player assist;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties({"players", "hibernateLazyInitializer", "handler"})
    private Team team;

    @ManyToOne
    @JsonIgnoreProperties({"goals", "weeklyFixture", "hibernateLazyInitializer", "handler"})
    private Match match;

    @ManyToOne
    @JsonIgnoreProperties({"goals", "series", "hibernateLazyInitializer", "handler"})
    private PlayoffGame playoffGame;

    public GoalEvent() {}

    public GoalEvent(
            int minute,
            PeriodType period,
            Player scorer,
            Player assist,
            Team team,
            Match match) {
        this.minute = minute;
        this.period = period;
        this.scorer = scorer;
        this.assist = assist;
        this.team = team;
        this.match = match;
    }

    public static GoalEvent forPlayoff(
            int minute,
            PeriodType period,
            Player scorer,
            Player assist,
            Team team,
            PlayoffGame playoffGame) {
        GoalEvent event = new GoalEvent();
        event.minute = minute;
        event.period = period;
        event.scorer = scorer;
        event.assist = assist;
        event.team = team;
        event.playoffGame = playoffGame;
        return event;
    }

    public Long getId() {
        return id;
    }

    public int getMinute() {
        return minute;
    }

    public PeriodType getPeriod() {
        return period;
    }

    public Player getScorer() {
        return scorer;
    }

    public Player getAssist() {
        return assist;
    }

    public Team getTeam() {
        return team;
    }

    public Match getMatch() {
        return match;
    }

    public PlayoffGame getPlayoffGame() {
        return playoffGame;
    }

    public void setMinute(int minute) {
        this.minute = minute;
    }

    public void setPeriod(PeriodType period) {
        this.period = period;
    }

    public void setScorer(Player scorer) {
        this.scorer = scorer;
    }

    public void setAssist(Player assist) {
        this.assist = assist;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public void setMatch(Match match) {
        this.match = match;
    }

    public void setPlayoffGame(PlayoffGame playoffGame) {
        this.playoffGame = playoffGame;
    }
}
