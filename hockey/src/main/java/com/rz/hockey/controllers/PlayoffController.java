package com.rz.hockey.controllers;

import com.rz.hockey.dto.MatchResultRequest;
import com.rz.hockey.dto.SeasonRequest;
import com.rz.hockey.entities.PlayoffBracket;
import com.rz.hockey.services.PlayoffService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/playoffs")
public class PlayoffController {

    private final PlayoffService playoffService;

    public PlayoffController(PlayoffService playoffService) {
        this.playoffService = playoffService;
    }

    @GetMapping
    public ResponseEntity<PlayoffBracket> getPlayoffs(@RequestParam String seasonYear) {
        return playoffService.getBracket(seasonYear)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping("/start")
    public PlayoffBracket startPlayoffs(@RequestBody SeasonRequest request) {
        return playoffService.startPlayoffs(request);
    }

    @PostMapping("/games/{gameId}/complete")
    public PlayoffBracket completeGame(
            @PathVariable Long gameId,
            @RequestBody MatchResultRequest request) {
        return playoffService.completeGame(gameId, request);
    }

    @PostMapping("/start-from-scratch")
    public ResponseEntity<Void> startFromScratch(@RequestBody SeasonRequest request) {
        playoffService.startFromScratch(request);
        return ResponseEntity.noContent().build();
    }
}
