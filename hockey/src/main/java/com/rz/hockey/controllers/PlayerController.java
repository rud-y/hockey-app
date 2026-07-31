package com.rz.hockey.controllers;

import com.rz.hockey.dto.PlayerStatsResponse;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.services.PlayerStatsService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/players")
@CrossOrigin(origins = "http://localhost:5173")
public class PlayerController {

    private final PlayerStatsService playerStatsService;

    public PlayerController(PlayerStatsService playerStatsService) {
        this.playerStatsService = playerStatsService;
    }

    @GetMapping("/stats")
    public List<PlayerStatsResponse> getPlayerStats(
            @RequestParam String seasonYear,
            @RequestParam CompetitionType competitionType) {
        return playerStatsService.getSeasonPlayerStats(seasonYear, competitionType);
    }
}
