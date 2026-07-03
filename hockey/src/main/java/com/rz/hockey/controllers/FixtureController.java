package com.rz.hockey.controllers;

import com.rz.hockey.dto.GenerateFixturesRequest;
import com.rz.hockey.dto.MatchResultRequest;
import com.rz.hockey.entities.Match;
import com.rz.hockey.entities.WeeklyFixture;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.services.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/fixtures")
@CrossOrigin(origins = "http://localhost:5173")
public class FixtureController {

    private final MatchService matchService;

    public FixtureController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping
    public ResponseEntity<List<WeeklyFixture>> getFixtures(
            @RequestParam CompetitionType competitionType,
            @RequestParam String seasonYear) {
        return ResponseEntity.ok(matchService.getFixtures(competitionType, seasonYear));
    }

    @PostMapping("/generate")
    public ResponseEntity<List<WeeklyFixture>> generateFixtures(@RequestBody GenerateFixturesRequest request) {
        return ResponseEntity.ok(matchService.generateFixtures(
                request.competitionType(), request.seasonYear()));
    }
}
