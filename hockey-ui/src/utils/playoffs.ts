/**
 * Number of teams that advance to the Playoffs after the regular season.
 * Takes the top half of the table, then adds one when that count is odd
 * so an even number of teams enter the Playoffs.
 *
 * With allowed league sizes 4 / 8 / 16 / 32 this is always half (2 / 4 / 8 / 16).
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

export const ALLOWED_TEAM_COUNTS = [4, 8, 16, 32] as const

export function getRoundLabel(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds) {
    return 'Stanley Cup Final'
  }
  return `Round ${roundNumber}`
}

export function gameTotalScore(game: {
  homeScorePeriod1: number
  awayScorePeriod1: number
  homeScorePeriod2: number
  awayScorePeriod2: number
  homeScorePeriod3: number
  awayScorePeriod3: number
  homeScoreOt: number
  awayScoreOt: number
}): { home: number; away: number } {
  const home =
    game.homeScorePeriod1 +
    game.homeScorePeriod2 +
    game.homeScorePeriod3 +
    game.homeScoreOt
  const away =
    game.awayScorePeriod1 +
    game.awayScorePeriod2 +
    game.awayScorePeriod3 +
    game.awayScoreOt
  return { home, away }
}
