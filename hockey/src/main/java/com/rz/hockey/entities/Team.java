package com.rz.hockey.entities;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String name;

    @Column
    private String shortName;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("team")
    private List<Player> players = new ArrayList<>();

    @Column
    private int goalsFor;

    @Column
    private int goalsAgainst;

    public Team() {}

    public Team(String name, String shortName) {
        this.name = name;
        this.shortName = shortName;
        this.goalsFor = 0;
        this.goalsAgainst = 0;
    }

    public String getName() {
        return name;
    }

    public String getShortName() {
        return shortName;
    }

    public Long getId() {
        return id;
    }

    public List<Player> getPlayers() {
        return players;
    }

    public int getGoalsFor() {
        return goalsFor;
    }

    public int getGoalsAgainst() {
        return goalsAgainst;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public void setGoalsFor(int goalsFor) {
        this.goalsFor = goalsFor;
    }

    public void setGoalsAgainst(int goalsAgainst) {
        this.goalsAgainst = goalsAgainst;
    }

    public void addPlayer(Player player) {
        players.add(player);
    }

    public void addMatchGoals(int scored, int conceded) {
        this.goalsFor += scored;
        this.goalsAgainst += conceded;
    }
}
