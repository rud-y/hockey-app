package com.rz.hockey.entities;
import com.rz.hockey.enums.PeriodType;
import jakarta.persistence.*;

public class AssistEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private int minute;

    @Enumerated(EnumType.STRING)
    private PeriodType period;

    @ManyToOne
    private Player assist;

    @ManyToOne
    private Team team;

    @ManyToOne
    private Match match;

    public AssistEvent() {}

    public AssistEvent(int minute, PeriodType period, Player assist, Team team, Match match) {
        this.minute = minute;
        this.period = period;
        this.assist = assist;
        this.team = team;
        this.match = match;
    }

    public int getMinute() {
        return minute;
    }

    public PeriodType getPeriod() {
        return period;
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

    public void setMinute(int minute) {
        this.minute = minute;
    }

    public void setPeriod(PeriodType period) {
        this.period = period;
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
}
