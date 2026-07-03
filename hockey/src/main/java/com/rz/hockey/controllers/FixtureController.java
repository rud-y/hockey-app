package com.rz.hockey.controllers;

import com.rz.hockey.dto.AdvanceWeekRequest;
import com.rz.hockey.dto.FixturesResponse;
import com.rz.hockey.dto.GenerateFixturesRequest;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.services.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/fixtures")
@CrossOrigin(origins = "http://localhost:5173")
public class FixtureController {

    private final MatchService matchService;

    public FixtureController(MatchService matchService) {
        this.matchService = matchService;
    }

    @GetMapping
    public ResponseEntity<FixturesResponse> getFixtures(
            @RequestParam CompetitionType competitionType,
            @RequestParam String seasonYear) {
        return ResponseEntity.ok(matchService.getFixtures(competitionType, seasonYear));
    }

    @PostMapping("/generate")
    public ResponseEntity<FixturesResponse> generateFixtures(@RequestBody GenerateFixturesRequest request) {
        return ResponseEntity.ok(matchService.generateFixtures(
                request.competitionType(), request.seasonYear()));
    }

    @PostMapping("/advance-week")
    public ResponseEntity<FixturesResponse> advanceWeek(@RequestBody AdvanceWeekRequest request) {
        return ResponseEntity.ok(matchService.advanceToNextWeek(
                request.competitionType(), request.seasonYear()));
    }
}
