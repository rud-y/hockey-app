package com.rz.hockey.controllers;

import com.rz.hockey.dto.MatchCompleteResponse;
import com.rz.hockey.dto.MatchResultRequest;
import com.rz.hockey.services.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/matches")
@CrossOrigin(origins = "http://localhost:5173")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping("/{matchId}/complete")
    public ResponseEntity<MatchCompleteResponse> completeMatch(
            @PathVariable Long matchId,
            @RequestBody MatchResultRequest request) {
        return ResponseEntity.ok(matchService.completeMatch(matchId, request));
    }
}
