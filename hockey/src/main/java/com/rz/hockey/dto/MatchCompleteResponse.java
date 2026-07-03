package com.rz.hockey.dto;

import com.rz.hockey.entities.Match;
import com.rz.hockey.entities.TableRow;

import java.util.List;

public record MatchCompleteResponse(
        Match match,
        List<TableRow> standings
) {}
