import { type PlayerProps } from '../interfaces/playerProps'
import { type TeamProps } from '../interfaces/teamProps'

export type GoalPeriod = 'FIRST' | 'SECOND' | 'THIRD' | 'OVERTIME'

export interface GoalEventProps {
  id?: number
  minute: number
  period: GoalPeriod
  scorer: PlayerProps
  assist?: PlayerProps | null
  team: Pick<TeamProps, 'id' | 'name' | 'shortName'>
}

export interface GoalEventPayload {
  period: GoalPeriod
  teamId: number
  scorerId: number
  assistId: number | null
  minute: number
}

export const periodSlotToApi = (slot: '1P' | '2P' | '3P' | 'OT'): GoalPeriod => {
  if (slot === '1P') return 'FIRST'
  if (slot === '2P') return 'SECOND'
  if (slot === '3P') return 'THIRD'
  return 'OVERTIME'
}

export const apiPeriodToSlot = (period: GoalPeriod): '1P' | '2P' | '3P' | 'OT' => {
  if (period === 'FIRST') return '1P'
  if (period === 'SECOND') return '2P'
  if (period === 'THIRD') return '3P'
  return 'OT'
}

export const shortPlayerName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts[parts.length - 1] ?? name
}

const pickRandom = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]

export const assignPeriodGoals = (
  team: TeamProps,
  goalCount: number,
  period: GoalPeriod,
): GoalEventPayload[] => {
  if (goalCount <= 0 || !team.id) {
    return []
  }

  const players = (team.players ?? []).filter((player) => player.id != null)
  if (players.length === 0) {
    return []
  }

  const events: GoalEventPayload[] = []
  for (let i = 0; i < goalCount; i += 1) {
    const scorer = pickRandom(players)
    const others = players.filter((player) => player.id !== scorer.id)
    const assist = others.length > 0 ? pickRandom(others) : null
    events.push({
      period,
      teamId: team.id,
      scorerId: scorer.id as number,
      assistId: assist?.id ?? null,
      minute: 1 + Math.floor(Math.random() * 20),
    })
  }
  return events
}

export const formatGoalLine = (
  teamShortName: string,
  scorerName: string,
  assistName?: string | null,
) =>
  assistName
    ? `${teamShortName} - ${shortPlayerName(scorerName)} / ${shortPlayerName(assistName)}`
    : `${teamShortName} - ${shortPlayerName(scorerName)}`

export const resolveGoalDisplay = (
  event: GoalEventPayload,
  homeTeam: TeamProps,
  awayTeam: TeamProps,
): string => {
  const team = homeTeam.id === event.teamId ? homeTeam : awayTeam
  const players = team.players ?? []
  const scorer = players.find((player) => player.id === event.scorerId)
  const assist = event.assistId
    ? players.find((player) => player.id === event.assistId)
    : null
  if (!scorer) {
    return `${team.shortName} - Goal`
  }
  return formatGoalLine(team.shortName, scorer.name, assist?.name)
}
