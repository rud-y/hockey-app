package com.rz.hockey.entities;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.rz.hockey.enums.CompetitionType;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
public class LeagueTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "leagueTable", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference
    private List<TableRow> rows;

    @Enumerated(EnumType.STRING)
    private CompetitionType competitionType;

    @Column
    private String seasonYear;

    public LeagueTable() {}

    public LeagueTable(List<TableRow> rows, CompetitionType competitionType, String season) {
        this.rows = rows;
        this.competitionType = competitionType;
        this.seasonYear = season;
    }

    public LeagueTable(CompetitionType competitionType, String season) {
        this.competitionType = competitionType;
        this.seasonYear = season;
    }

    public String getSeasonYear() {
        return seasonYear;
    }

    public CompetitionType getCompetitionType() {
        return competitionType;
    }

    public List<TableRow> getRows() {
        return rows;
    }

    public Long getId() {
        return id;
    }

    public void setRows(List<TableRow> rows) {
        this.rows = rows;
    }

    public void setCompetitionType(CompetitionType competitionType) {
        this.competitionType = competitionType;
    }

    public void setSeasonYear(String seasonYear) {
        this.seasonYear = seasonYear;
    }

    public void addRow(TableRow row) {
        if (this.rows == null) {
            this.rows = new ArrayList<>();
        }
        this.rows.add(row);
        row.setLeagueTable(this);
    }

}
