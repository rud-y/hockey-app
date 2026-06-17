package com.rz.hockey.controllers;

import com.rz.hockey.dto.CreateTeamRequest;
import com.rz.hockey.entities.TableRow;
import com.rz.hockey.entities.Team;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.services.LeagueTableService;
import com.rz.hockey.services.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/teams")
@CrossOrigin(origins = "http://localhost:5173")
public class TeamController {

    private final TeamService teamService;
    private final LeagueTableService leagueTableService;


    public TeamController(TeamService teamService, LeagueTableService leagueTableService) {
        this.teamService = teamService;
        this.leagueTableService = leagueTableService;
    }

  @GetMapping
  public ResponseEntity<List<Team>> getTeams(
          @RequestParam(required = false) CompetitionType competitionType,
          @RequestParam(required = false) String seasonYear) {

    // If parametersprovided, filter teams by competition
    if (competitionType != null && seasonYear != null) {
      List<Team> filteredTeams = leagueTableService.getTeamsByCompetition(competitionType, seasonYear);
      return ResponseEntity.ok(filteredTeams);
    }

    return ResponseEntity.ok(teamService.findAll());
  }

  @PostMapping
  public ResponseEntity<TableRow> createTeam(@RequestBody CreateTeamRequest request) {
    return ResponseEntity.ok(teamService.createTeamWithLeagueRow(request));
  }
}