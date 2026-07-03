export const MAX_TEAMS = 14
export const PERIOD_DURATION_SECONDS = 3
export const BREAK_DURATION_SECONDS = 2

export const randomPeriodScore = () => Math.floor(Math.random() * 4)

export const randomOvertimeScore = (): { home: number; away: number } =>
  Math.random() < 0.5 ? { home: 1, away: 0 } : { home: 0, away: 1 }

export const sumScores = (scores: number[]) => scores.reduce((sum, score) => sum + score, 0)
