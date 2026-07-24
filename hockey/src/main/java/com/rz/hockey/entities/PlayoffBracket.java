package com.rz.hockey.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.rz.hockey.enums.PlayoffStatus;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class PlayoffBracket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String seasonYear;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlayoffStatus status = PlayoffStatus.IN_PROGRESS;

    @Column(nullable = false)
    private int currentRound = 1;

    @Column(nullable = false)
    private int totalRounds;

    @Column(nullable = false)
    private int playoffTeamCount;

    @ManyToOne
    @JsonIgnoreProperties({"players", "hibernateLazyInitializer", "handler"})
    private Team champion;

    @OneToMany(mappedBy = "bracket", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("roundNumber ASC, seriesIndex ASC")
    @JsonManagedReference
    private List<PlayoffSeries> series = new ArrayList<>();

    public PlayoffBracket() {}

    public PlayoffBracket(String seasonYear, int playoffTeamCount, int totalRounds) {
        this.seasonYear = seasonYear;
        this.playoffTeamCount = playoffTeamCount;
        this.totalRounds = totalRounds;
        this.status = PlayoffStatus.IN_PROGRESS;
        this.currentRound = 1;
    }

    public void addSeries(PlayoffSeries playoffSeries) {
        series.add(playoffSeries);
        playoffSeries.setBracket(this);
    }

    public Long getId() {
        return id;
    }

    public String getSeasonYear() {
        return seasonYear;
    }

    public PlayoffStatus getStatus() {
        return status;
    }

    public int getCurrentRound() {
        return currentRound;
    }

    public int getTotalRounds() {
        return totalRounds;
    }

    public int getPlayoffTeamCount() {
        return playoffTeamCount;
    }

    public Team getChampion() {
        return champion;
    }

    public List<PlayoffSeries> getSeries() {
        return series;
    }

    public void setStatus(PlayoffStatus status) {
        this.status = status;
    }

    public void setCurrentRound(int currentRound) {
        this.currentRound = currentRound;
    }

    public void setChampion(Team champion) {
        this.champion = champion;
    }
}
