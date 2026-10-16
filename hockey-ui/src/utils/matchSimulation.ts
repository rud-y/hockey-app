export const MAX_TEAMS = 32
export const ALLOWED_TEAM_COUNTS = [4, 8, 16, 32] as const
/** How long each goal stays on the score before the next one. */
export const GOAL_REVEAL_SECONDS = 1
/** Extra second after the last goal, so that score can be read before the break. */
export const PERIOD_END_HOLD_SECONDS = 1
/** Intermission between periods. */
export const BREAK_DURATION_SECONDS = 2

export const MAX_GOALS_PERIOD_1 = 3
export const MAX_GOALS_PERIOD_2 = 2
export const MAX_GOALS_PERIOD_3 = 4

export const randomPeriodScore = (maxGoals: number) =>
  Math.floor(Math.random() * (maxGoals + 1))

export const randomOvertimeScore = (): { home: number; away: number } =>
  Math.random() < 0.5 ? { home: 1, away: 0 } : { home: 0, away: 1 }

export const sumScores = (scores: number[]) => scores.reduce((sum, score) => sum + score, 0)
