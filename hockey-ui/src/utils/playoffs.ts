/**
 * Number of teams that advance to the Playoffs after the regular season.
 * Takes the top half of the table, then adds one when that count is odd
 * so an even number of teams enter the Playoffs.
 *
 * Examples: 16 → 8, 14 → 8, 10 → 6, 12 → 6.
 */
export function getPlayoffTeamCount(totalTeams: number): number {
  if (totalTeams < 2) {
    return 0
  }

  let playoffSpots = Math.ceil(totalTeams / 2)
  if (playoffSpots % 2 !== 0) {
    playoffSpots += 1
  }

  return Math.min(playoffSpots, totalTeams)
}
