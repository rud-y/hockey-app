import { type TeamProps } from './teamProps'

export interface PlayoffGameProps {
  id: number
  gameNumber: number
  homeTeam: TeamProps
  awayTeam: TeamProps
  completed: boolean
  homeScorePeriod1: number
  awayScorePeriod1: number
  homeScorePeriod2: number
  awayScorePeriod2: number
  homeScorePeriod3: number
  awayScorePeriod3: number
  homeScoreOt: number
  awayScoreOt: number
}

export interface PlayoffSeriesProps {
  id: number
  roundNumber: number
  seriesIndex: number
  higherSeedTeam: TeamProps
  lowerSeedTeam: TeamProps
  higherSeedRank: number
  lowerSeedRank: number
  higherSeedWins: number
  lowerSeedWins: number
  winner: TeamProps | null
  completed: boolean
  games: PlayoffGameProps[]
}

export type PlayoffStatus = 'IN_PROGRESS' | 'COMPLETED'

export interface PlayoffBracketProps {
  id: number
  seasonYear: string
  status: PlayoffStatus
  currentRound: number
  totalRounds: number
  playoffTeamCount: number
  champion: TeamProps | null
  series: PlayoffSeriesProps[]
}
