package com.rz.hockey;

import com.rz.hockey.entities.LeagueTable;
import com.rz.hockey.entities.TableRow;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.repositories.LeagueTableRepository;
import com.rz.hockey.repositories.TeamRepository;
import jakarta.servlet.ServletOutputStream;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import com.rz.hockey.entities.Player;
import com.rz.hockey.entities.Team;
import org.springframework.context.annotation.Bean;
import java.util.ArrayList;

@SpringBootApplication
public class HockeyApplication {

        public static void main(String[] args) {
                SpringApplication.run(HockeyApplication.class, args);
                System.out.println("Hockey application started . . . ");

        }

        @Bean
        public CommandLineRunner demoData(
                TeamRepository teamRepository,
                LeagueTableRepository leagueTableRepository
        ) {
                return args -> {
                        Team tor = new Team("Toronto Maple Leafs", "TOR");
                        Team isl = new Team("New York Islanders", "NYI");
                        Team van = new Team("Vancouver Canucks", "VAN");

                        teamRepository.save(tor);
                        teamRepository.save(isl);
                        teamRepository.save(van);


                        LeagueTable regularSeason = new LeagueTable(CompetitionType.REGULAR_SEASON, "2026");

                        TableRow torRow = new TableRow();
                        torRow.setTeam(tor);
                        torRow.setLeagueTable(regularSeason);
                        torRow.setGamesPlayed(5);
                        torRow.setWins(4);
                        torRow.setLosses(1);
                        torRow.setPoints(8); // 2 points win

                        TableRow islRow = new TableRow();
                        islRow.setTeam(isl);
                        islRow.setLeagueTable(regularSeason);
                        islRow.setGamesPlayed(5);
                        islRow.setWins(2);
                        islRow.setLosses(3);
                        islRow.setPoints(4);

                        // TableRow vanRow = new TableRow();
                        // islRow.setTeam(van);
                        // islRow.setLeagueTable(regularSeason);
                        // islRow.setGamesPlayed(5);
                        // islRow.setWins(2);
                        // islRow.setLosses(3);
                        // islRow.setPoints(4);

                        // regularSeason.addRow(torRow);
                        // regularSeason.addRow(islRow);

                        leagueTableRepository.save(regularSeason);

                        System.out.println("✅ Database Seeded: 2026 Regular Season League Table created with rows.");
                };
        }

}