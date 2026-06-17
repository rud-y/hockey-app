package com.rz.hockey.entities;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.rz.hockey.enums.StreakType;
import jakarta.persistence.*;

@Entity
public class TableRow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Team team;

    @ManyToOne(optional = false)
    @JsonBackReference
    private LeagueTable leagueTable;

    @Column
    private int gamesPlayed;

    @Column
    private int wins;

    @Column
    private int losses;

    @Column
    private int otLosses;

    @Column
    private int points;

    @Enumerated(EnumType.STRING)
    private StreakType streak;

    @Column
    private int streakCount;

    public TableRow() {}

    public TableRow(Team team, LeagueTable leagueTable, int gamesPlayed, int wins, int losses, int otLosses, int points, StreakType streak, int streakCount) {
        this.team = team;
        this.leagueTable = leagueTable;
        this.gamesPlayed = gamesPlayed;
        this.wins = wins;
        this.losses = losses;
        this.otLosses = otLosses;
        this.points = points;
        this.streak = streak;
        this.streakCount = streakCount;
    }

    public Team getTeam() {
        return team;
    }

    public LeagueTable getLeagueTable() {
        return leagueTable;
    }

    public int getNumberOfGames() { return gamesPlayed; }

    public int getGamesPlayed() { return gamesPlayed; }

    public Long getId() {
        return id;
    }

    public int getWins() {
        return wins;
    }

    public int getLosses() {
        return losses;
    }

    public int getOtLosses() {
        return otLosses;
    }

    public int getPoints() {
        return points;
    }

    public StreakType getStreak() {
        return streak;
    }

    public int getStreakCount() {
        return streakCount;
    }

    //Setters

    public void setTeam(Team team) {
        this.team = team;
    }

    public void setLeagueTable(LeagueTable leagueTable) {
        this.leagueTable = leagueTable;
    }

    public int setGamesPlayed(int numOfGames) { return gamesPlayed = numOfGames; }

    public void setWins(int wins) {
        this.wins = wins;
    }

    public void setLosses(int losses) {
        this.losses = losses;
    }

    public void setOtLosses(int otLosses) {
        this.otLosses = otLosses;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public void setStreak(StreakType streak) {
        this.streak = streak;
    }

    public void setStreakCount(int streakCount) {
        this.streakCount = streakCount;
    }
}
