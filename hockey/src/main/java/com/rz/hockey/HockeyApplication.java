package com.rz.hockey;

import com.rz.hockey.entities.LeagueTable;
import com.rz.hockey.entities.Player;
import com.rz.hockey.entities.TableRow;
import com.rz.hockey.entities.Team;
import com.rz.hockey.enums.CompetitionType;
import com.rz.hockey.repositories.LeagueTableRepository;
import com.rz.hockey.repositories.PlayerRepository;
import com.rz.hockey.repositories.TeamRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@SpringBootApplication
public class HockeyApplication {

        public static void main(String[] args) {
                SpringApplication.run(HockeyApplication.class, args);
                System.out.println("Hockey application started . . . ");
        }

        @Bean
        public CommandLineRunner demoData(
                TeamRepository teamRepository,
                PlayerRepository playerRepository,
                LeagueTableRepository leagueTableRepository
        ) {
                return args -> {
                        Team tor = new Team("Toronto Maple Leafs", "TOR");
                        Team isl = new Team("New York Islanders", "NYI");
                        Team van = new Team("Vancouver Canucks", "VAN");

                        teamRepository.save(tor);
                        teamRepository.save(isl);
                        teamRepository.save(van);

                        Player lee = new Player("Lee", isl);
                        Player barzal = new Player("Barzal", isl);
                        Player cizikas = new Player("Cizikas", isl);
                        Player schenn = new Player("Schenn", isl);
                        Player palmieri = new Player("Palmieri", isl);

                        isl.addPlayer(lee);
                        isl.addPlayer(barzal);
                        isl.addPlayer(cizikas);
                        isl.addPlayer(schenn);
                        isl.addPlayer(palmieri);

                        Player raddysh = new Player("Raddysh", tor);
                        Player matthews = new Player("Matthews", tor);
                        Player knies = new Player("Knies", tor);
                        Player joshua = new Player("Joshua", tor);
                        Player domi = new Player("Domi", tor);

                        tor.addPlayer(raddysh);
                        tor.addPlayer(matthews);
                        tor.addPlayer(knies);
                        tor.addPlayer(joshua);
                        tor.addPlayer(domi);

                        Player oleksiak = new Player("Oleksiak", van);
                        Player hronek = new Player("Hronek", van);
                        Player pettersson = new Player("Pettersson", van);
                        Player sasson = new Player("Sasson", van);
                        Player oConnor = new Player("O'Connor", van);

                        van.addPlayer(oleksiak);
                        van.addPlayer(hronek);
                        van.addPlayer(pettersson);
                        van.addPlayer(sasson);
                        van.addPlayer(oConnor);

                        playerRepository.saveAll(List.of(
                                lee, barzal, cizikas, schenn, palmieri,
                                raddysh, matthews, knies, joshua, domi,
                                oleksiak, hronek, pettersson, sasson, oConnor
                        ));

                        LeagueTable regularSeason = new LeagueTable(CompetitionType.REGULAR_SEASON, "2026");

                        TableRow torRow = new TableRow();
                        torRow.setTeam(tor);
                        torRow.setLeagueTable(regularSeason);
                        torRow.setGamesPlayed(0);
                        torRow.setWins(0);
                        torRow.setLosses(0);
                        torRow.setPoints(0);

                        TableRow islRow = new TableRow();
                        islRow.setTeam(isl);
                        islRow.setLeagueTable(regularSeason);
                        islRow.setGamesPlayed(0);
                        islRow.setWins(0);
                        islRow.setLosses(0);
                        islRow.setPoints(0);

                        TableRow vanRow = new TableRow();
                        vanRow.setTeam(van);
                        vanRow.setLeagueTable(regularSeason);
                        vanRow.setGamesPlayed(0);
                        vanRow.setWins(0);
                        vanRow.setLosses(0);
                        vanRow.setPoints(0);

                        regularSeason.addRow(torRow);
                        regularSeason.addRow(islRow);
                        regularSeason.addRow(vanRow);

                        leagueTableRepository.save(regularSeason);

                        System.out.println("✅ Database Seeded: 2026 Regular Season League Table created with rows.");
                };
        }
}
