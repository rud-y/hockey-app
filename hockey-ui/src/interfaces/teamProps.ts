import { type PlayerProps } from './playerProps'

export interface TeamProps {
  id?: number
  name: string
  shortName: string
  players: PlayerProps[]
  goalsFor?: number
  goalsAgainst?: number
}
