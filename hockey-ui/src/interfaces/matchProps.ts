import { type TeamProps } from './teamProps'

export interface MatchProps {
  id: number
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

export interface WeeklyFixtureProps {
  id: number
  weekNumber: number
  matches: MatchProps[]
}

export interface FixturesResponseProps {
  activeWeekNumber: number
  totalWeeks: number
  fixtures: WeeklyFixtureProps[]
}

export interface MatchResultPayload {
  homeScorePeriod1: number
  awayScorePeriod1: number
  homeScorePeriod2: number
  awayScorePeriod2: number
  homeScorePeriod3: number
  awayScorePeriod3: number
  homeScoreOt: number
  awayScoreOt: number
}
