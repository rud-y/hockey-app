package com.rz.hockey.controllers;

import com.rz.hockey.entities.TableRow;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.services.LeagueTableService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/league-tables")
@CrossOrigin(origins = "http://localhost:5173")
public class LeagueTableController {

    private final LeagueTableService leagueTableService;

    public LeagueTableController(LeagueTableService leagueTableService) {
        this.leagueTableService = leagueTableService;
    }

    @GetMapping(params = {"competitionType", "seasonYear"})
    public ResponseEntity<List<TableRow>> getStandingsByCompetition(
            @RequestParam CompetitionType competitionType,
            @RequestParam String seasonYear) {
        return ResponseEntity.ok(
                leagueTableService.getStandingsByCompetition(competitionType, seasonYear));
    }

    @GetMapping("/{id}")
    public ResponseEntity<List<TableRow>> getStandings(@PathVariable Long id) {
        return ResponseEntity.ok(leagueTableService.getStandings(id));
    }

    @DeleteMapping("/rows/{rowId}")
    public ResponseEntity<Void> deleteTableRow(@PathVariable Long rowId) {
        leagueTableService.deleteTableRow(rowId);
        return ResponseEntity.noContent().build();
    }
}