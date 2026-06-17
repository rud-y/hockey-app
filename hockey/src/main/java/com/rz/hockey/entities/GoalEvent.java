package com.rz.hockey.entities;
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

    @ManyToOne
    private Player scorer;

    @ManyToOne
    private Team team;

    @ManyToOne
    private Match match;

    public GoalEvent() {}

    public GoalEvent(int minute, PeriodType period, Player scorer, Team team, Match match) {
        this.minute = minute;
        this.period = period;
        this.scorer = scorer;
        this.team = team;
        this.match = match;
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

    public Team getTeam() {
        return team;
    }

    public Match getMatch() {
        return match;
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

    public void setTeam(Team team) {
        this.team = team;
    }

    public void setMatch(Match match) {
        this.match = match;
    }
}
