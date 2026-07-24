package com.rz.hockey.entities;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class PlayoffSeries {

    public static final int WINS_TO_ADVANCE = 4;
    public static final int MAX_GAMES = 7;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JsonBackReference
    private PlayoffBracket bracket;

    @Column(nullable = false)
    private int roundNumber;

    @Column(nullable = false)
    private int seriesIndex;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties({"players", "hibernateLazyInitializer", "handler"})
    private Team higherSeedTeam;

    @ManyToOne(optional = false)
    @JsonIgnoreProperties({"players", "hibernateLazyInitializer", "handler"})
    private Team lowerSeedTeam;

    @Column(nullable = false)
    private int higherSeedRank;

    @Column(nullable = false)
    private int lowerSeedRank;

    @Column(nullable = false)
    private int higherSeedWins;

    @Column(nullable = false)
    private int lowerSeedWins;

    @ManyToOne
    @JsonIgnoreProperties({"players", "hibernateLazyInitializer", "handler"})
    private Team winner;

    @Column(nullable = false)
    private boolean completed;

    @OneToMany(mappedBy = "series", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("gameNumber ASC")
    @JsonManagedReference
    private List<PlayoffGame> games = new ArrayList<>();

    public PlayoffSeries() {}

    public PlayoffSeries(
            int roundNumber,
            int seriesIndex,
            Team higherSeedTeam,
            Team lowerSeedTeam,
            int higherSeedRank,
            int lowerSeedRank) {
        this.roundNumber = roundNumber;
        this.seriesIndex = seriesIndex;
        this.higherSeedTeam = higherSeedTeam;
        this.lowerSeedTeam = lowerSeedTeam;
        this.higherSeedRank = higherSeedRank;
        this.lowerSeedRank = lowerSeedRank;
        this.higherSeedWins = 0;
        this.lowerSeedWins = 0;
        this.completed = false;
    }

    public void addGame(PlayoffGame game) {
        games.add(game);
        game.setSeries(this);
    }

    public Long getId() {
        return id;
    }

    public PlayoffBracket getBracket() {
        return bracket;
    }

    public int getRoundNumber() {
        return roundNumber;
    }

    public int getSeriesIndex() {
        return seriesIndex;
    }

    public Team getHigherSeedTeam() {
        return higherSeedTeam;
    }

    public Team getLowerSeedTeam() {
        return lowerSeedTeam;
    }

    public int getHigherSeedRank() {
        return higherSeedRank;
    }

    public int getLowerSeedRank() {
        return lowerSeedRank;
    }

    public int getHigherSeedWins() {
        return higherSeedWins;
    }

    public int getLowerSeedWins() {
        return lowerSeedWins;
    }

    public Team getWinner() {
        return winner;
    }

    public boolean isCompleted() {
        return completed;
    }

    public List<PlayoffGame> getGames() {
        return games;
    }

    public void setBracket(PlayoffBracket bracket) {
        this.bracket = bracket;
    }

    public void setHigherSeedWins(int higherSeedWins) {
        this.higherSeedWins = higherSeedWins;
    }

    public void setLowerSeedWins(int lowerSeedWins) {
        this.lowerSeedWins = lowerSeedWins;
    }

    public void setWinner(Team winner) {
        this.winner = winner;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
