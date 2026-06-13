import { type TeamProps } from './teamProps'

export interface TableRowProps {
  id?: number
  team: TeamProps
  gamesPlayed: number
  wins: number
  losses: number
  otLosses: number
  points: number
  streak?: 'W' | 'L' | null
  streakCount: number
}
