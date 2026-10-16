import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { API_BASE_URL } from '../constants/api'
import {
  type MatchProps,
  type MatchResultPayload,
  type MatchCompleteResponseProps,
} from '../interfaces/matchProps'
import { type PlayoffBracketProps, type PlayoffGameProps } from '../interfaces/playoffProps'
import { type TableRowProps } from '../interfaces/tableRowProps'
import {
  assignPeriodGoals,
  apiPeriodToSlot,
  formatGoalLine,
  periodSlotToApi,
  resolveGoalDisplay,
  type GoalEventPayload,
  type GoalEventProps,
  type GoalPeriod,
} from '../utils/goalEvents'
import {
  BREAK_DURATION_SECONDS,
  GOAL_REVEAL_SECONDS,
  PERIOD_END_HOLD_SECONDS,
  MAX_GOALS_PERIOD_1,
  MAX_GOALS_PERIOD_2,
  MAX_GOALS_PERIOD_3,
  randomOvertimeScore,
  randomPeriodScore,
  sumScores,
} from '../utils/matchSimulation'

interface MatchCardProps {
  match: MatchProps | PlayoffGameProps
  playable: boolean
  onMatchCompleted?: (standings?: TableRowProps[]) => void
  completeUrl?: string
  onPlayoffCompleted?: (bracket: PlayoffBracketProps) => void
  lockedMessage?: string
}

type MatchPhase =
  | 'ready'
  | 'period1'
  | 'break1'
  | 'period2'
  | 'break2'
  | 'period3'
  | 'break3'
  | 'overtime'
  | 'finished'

type PeriodSlot = '1P' | '2P' | '3P' | 'OT' | null

const PLAYOFF_SERIES_UPDATE_DELAY_MS = 1000

interface PeriodScores {
  home: [number, number, number]
  away: [number, number, number]
  otHome: number
  otAway: number
}

const goalsFromMatch = (match: MatchProps | PlayoffGameProps): GoalEventPayload[] => {
  if (!('goals' in match) || !match.goals) return []
  return match.goals
    .map((g: GoalEventProps) => ({
      period: g.period,
      teamId: g.team.id!,
      scorerId: g.scorer.id!,
      assistId: g.assist?.id ?? null,
      minute: g.minute,
    }))
    .filter((g) => g.teamId && g.scorerId)
}

const activePeriodSlot = (phase: MatchPhase): PeriodSlot => {
  if (phase === 'period1' || phase === 'break1') return '1P'
  if (phase === 'period2' || phase === 'break2') return '2P'
  if (phase === 'period3' || phase === 'break3') return '3P'
  if (phase === 'overtime') return 'OT'
  return null
}

const isPeriodHighlighted = (phase: MatchPhase, slot: PeriodSlot) => {
  if (slot === '1P') return phase === 'period1' || phase === 'break1'
  if (slot === '2P') return phase === 'period2' || phase === 'break2'
  if (slot === '3P') return phase === 'period3'
  if (slot === 'OT') return phase === 'overtime'
  return false
}

const isScoringPhase = (phase: MatchPhase) =>
  phase === 'period1' || phase === 'period2' || phase === 'period3' || phase === 'overtime'

const phaseForSlot = (slot: '1P' | '2P' | '3P' | 'OT'): MatchPhase => {
  if (slot === '1P') return 'period1'
  if (slot === '2P') return 'period2'
  if (slot === '3P') return 'period3'
  return 'overtime'
}

const endOfPeriodMessage = (phase: MatchPhase) => {
  if (phase === 'period1') return 'End of 1st period'
  if (phase === 'period2') return 'End of 2nd period'
  if (phase === 'period3') return 'End of 3rd period'
  return 'End of overtime'
}

const incrementScore = (
  current: PeriodScores,
  period: GoalPeriod,
  isHome: boolean,
): PeriodScores => {
  if (period === 'OVERTIME') {
    return {
      ...current,
      otHome: current.otHome + (isHome ? 1 : 0),
      otAway: current.otAway + (isHome ? 0 : 1),
    }
  }

  const index = period === 'FIRST' ? 0 : period === 'SECOND' ? 1 : 2
  const home: [number, number, number] = [current.home[0], current.home[1], current.home[2]]
  const away: [number, number, number] = [current.away[0], current.away[1], current.away[2]]
  if (isHome) home[index] += 1
  else away[index] += 1
  return { ...current, home, away }
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  playable,
  onMatchCompleted,
  completeUrl,
  onPlayoffCompleted,
  lockedMessage = 'Available in a future fixture week',
}) => {
  const [scores, setScores] = useState<PeriodScores>({
    home: [match.homeScorePeriod1, match.homeScorePeriod2, match.homeScorePeriod3],
    away: [match.awayScorePeriod1, match.awayScorePeriod2, match.awayScorePeriod3],
    otHome: match.homeScoreOt,
    otAway: match.awayScoreOt,
  })
  const [completedPeriods, setCompletedPeriods] = useState<[boolean, boolean, boolean]>([
    match.completed,
    match.completed,
    match.completed,
  ])
  const [phase, setPhase] = useState<MatchPhase>(match.completed ? 'finished' : 'ready')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [awaitingOvertime, setAwaitingOvertime] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(
    match.completed ? 'Match finished' : null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [goalEvents, setGoalEvents] = useState<GoalEventPayload[]>(() => goalsFromMatch(match))
  const [scoreFlash, setScoreFlash] = useState<'home' | 'away' | null>(null)
  const [flashKey, setFlashKey] = useState(0)
  const handledTickRef = useRef<string | null>(null)
  const hasSubmittedRef = useRef(match.completed)
  const scoresRef = useRef(scores)
  const goalsRef = useRef(goalEvents)
  const playoffDelayRef = useRef<number | null>(null)
  const goalQueueRef = useRef<GoalEventPayload[]>([])
  const concludedPhaseRef = useRef<MatchPhase | null>(null)
  const applyGoalRef = useRef<(goal: GoalEventPayload) => void>(() => {})
  const concludePeriodRef = useRef<(endedPhase: MatchPhase) => void>(() => {})

  useEffect(() => {
    scoresRef.current = scores
  }, [scores])

  useEffect(() => {
    goalsRef.current = goalEvents
  }, [goalEvents])

  useEffect(() => {
    hasSubmittedRef.current = match.completed
  }, [match.id, match.completed])

  useEffect(() => {
    return () => {
      if (playoffDelayRef.current != null) {
        window.clearTimeout(playoffDelayRef.current)
      }
    }
  }, [])

  const homeRegulation = sumScores(scores.home)
  const awayRegulation = sumScores(scores.away)
  const homeTotal = homeRegulation + scores.otHome
  const awayTotal = awayRegulation + scores.otAway
  const isFinished = phase === 'finished' || match.completed
  const regulationComplete =
    completedPeriods[0] && completedPeriods[1] && completedPeriods[2]
  const regulationTied =
    regulationComplete &&
    homeRegulation === awayRegulation &&
    scores.otHome === 0 &&
    scores.otAway === 0
  const showOvertime =
    awaitingOvertime ||
    regulationTied ||
    scores.otHome > 0 ||
    scores.otAway > 0 ||
    match.homeScoreOt > 0

  const periodRunning =
    phase === 'period1' || phase === 'period2' || phase === 'period3' || phase === 'overtime'
  const breakRunning = phase === 'break1' || phase === 'break2' || phase === 'break3'
  const isLive = playable && !isFinished && (periodRunning || breakRunning || isSubmitting)
  const timerSlot = activePeriodSlot(phase)
  const showTimer = breakRunning && secondsLeft > 0 && timerSlot != null

  const homeWon = isFinished && homeTotal > awayTotal
  const awayWon = isFinished && awayTotal > homeTotal

  const submitResult = useCallback(
    async (finalScores: PeriodScores) => {
      if (hasSubmittedRef.current || match.completed) {
        return
      }
      hasSubmittedRef.current = true
      setIsSubmitting(true)
      setAutoPlay(false)

      const payload: MatchResultPayload = {
        homeScorePeriod1: finalScores.home[0],
        awayScorePeriod1: finalScores.away[0],
        homeScorePeriod2: finalScores.home[1],
        awayScorePeriod2: finalScores.away[1],
        homeScorePeriod3: finalScores.home[2],
        awayScorePeriod3: finalScores.away[2],
        homeScoreOt: finalScores.otHome,
        awayScoreOt: finalScores.otAway,
        goals: goalsRef.current,
      }

      try {
        const url = completeUrl ?? `${API_BASE_URL}/matches/${match.id}/complete`
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null)
          throw new Error(errorBody?.message ?? 'Failed to save match result.')
        }

        const result = await response.json()

        setAwaitingOvertime(false)
        setPhase('finished')
        setStatusMessage('Match finished')
        setIsSubmitting(false)

        if (onPlayoffCompleted) {
          playoffDelayRef.current = window.setTimeout(() => {
            onPlayoffCompleted(result as PlayoffBracketProps)
            playoffDelayRef.current = null
          }, PLAYOFF_SERIES_UPDATE_DELAY_MS)
        } else {
          const regularResult = result as MatchCompleteResponseProps
          onMatchCompleted?.(regularResult.standings)
        }
      } catch (err) {
        hasSubmittedRef.current = false
        console.error('Error completing match:', err)
        setStatusMessage(err instanceof Error ? err.message : 'Could not save match result.')
        setIsSubmitting(false)
      }
    },
    [match.id, match.completed, onMatchCompleted, completeUrl, onPlayoffCompleted],
  )

  const finishMatch = useCallback(
    (nextScores: PeriodScores) => {
      void submitResult(nextScores)
    },
    [submitResult],
  )

  const beginPeriod = useCallback((slot: '1P' | '2P' | '3P' | 'OT') => {
    const period = periodSlotToApi(slot)
    let homeCount = 0
    let awayCount = 0
    if (slot === 'OT') {
      const overtime = randomOvertimeScore()
      homeCount = overtime.home
      awayCount = overtime.away
    } else if (slot === '1P') {
      homeCount = randomPeriodScore(MAX_GOALS_PERIOD_1)
      awayCount = randomPeriodScore(MAX_GOALS_PERIOD_1)
    } else if (slot === '2P') {
      homeCount = randomPeriodScore(MAX_GOALS_PERIOD_2)
      awayCount = randomPeriodScore(MAX_GOALS_PERIOD_2)
    } else {
      homeCount = randomPeriodScore(MAX_GOALS_PERIOD_3)
      awayCount = randomPeriodScore(MAX_GOALS_PERIOD_3)
    }

    goalQueueRef.current = [
      ...assignPeriodGoals(match.homeTeam, homeCount, period),
      ...assignPeriodGoals(match.awayTeam, awayCount, period),
    ].sort((a, b) => a.minute - b.minute || a.teamId - b.teamId)

    concludedPhaseRef.current = null
    handledTickRef.current = null
    setScoreFlash(null)
    setStatusMessage(null)
    setPhase(phaseForSlot(slot))
  }, [match.homeTeam, match.awayTeam])

  const startMatch = () => {
    setAutoPlay(true)
    setAwaitingOvertime(false)
    beginPeriod('1P')
  }

  const playOvertime = () => {
    setAutoPlay(false)
    setAwaitingOvertime(false)
    beginPeriod('OT')
  }

  applyGoalRef.current = (goal: GoalEventPayload) => {
    const isHome = goal.teamId === match.homeTeam.id
    const nextScores = incrementScore(scoresRef.current, goal.period, isHome)
    scoresRef.current = nextScores
    setScores(nextScores)

    const nextGoals = [...goalsRef.current, goal]
    goalsRef.current = nextGoals
    setGoalEvents(nextGoals)

    setScoreFlash(isHome ? 'home' : 'away')
    setFlashKey((current) => current + 1)
  }

  concludePeriodRef.current = (endedPhase: MatchPhase) => {
    if (concludedPhaseRef.current === endedPhase) return
    concludedPhaseRef.current = endedPhase

    if (endedPhase === 'period1' || endedPhase === 'period2') {
      setCompletedPeriods((current) =>
        endedPhase === 'period1' ? [true, current[1], current[2]] : [current[0], true, current[2]],
      )
      setStatusMessage(endOfPeriodMessage(endedPhase))
      setPhase(endedPhase === 'period1' ? 'break1' : 'break2')
      setSecondsLeft(BREAK_DURATION_SECONDS)
      return
    }

    if (endedPhase === 'period3') {
      setCompletedPeriods([true, true, true])
      const nextScores = scoresRef.current
      if (sumScores(nextScores.home) === sumScores(nextScores.away)) {
        setAutoPlay(false)
        setAwaitingOvertime(true)
        setStatusMessage('End of 3rd period. Play overtime to decide the winner')
        setPhase('ready')
        return
      }
      setStatusMessage('End of 3rd period')
      finishMatch(nextScores)
      return
    }

    if (endedPhase === 'overtime') {
      finishMatch(scoresRef.current)
    }
  }

  useEffect(() => {
    if (secondsLeft <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [secondsLeft])

  useEffect(() => {
    if (!isScoringPhase(phase)) return

    let cancelled = false
    const timeouts: number[] = []
    const goals = goalQueueRef.current.slice()
    const stepMs = GOAL_REVEAL_SECONDS * 1000
    const periodMs = (goals.length * GOAL_REVEAL_SECONDS + PERIOD_END_HOLD_SECONDS) * 1000

    goals.forEach((goal, index) => {
      timeouts.push(
        window.setTimeout(() => {
          if (cancelled) return
          applyGoalRef.current(goal)
        }, stepMs * (index + 1)),
      )
    })

    timeouts.push(
      window.setTimeout(() => {
        if (cancelled) return
        concludePeriodRef.current(phase)
      }, periodMs),
    )

    return () => {
      cancelled = true
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'break1' && phase !== 'break2') return
    if (secondsLeft > 0) return

    const tickKey = `${phase}:0`
    if (handledTickRef.current === tickKey) return
    handledTickRef.current = tickKey

    if (phase === 'break1') {
      if (autoPlay) beginPeriod('2P')
      else setPhase('ready')
      return
    }

    if (autoPlay) beginPeriod('3P')
    else setPhase('ready')
  }, [phase, secondsLeft, autoPlay, beginPeriod])

  const canStartMatch =
    playable &&
    phase === 'ready' &&
    !completedPeriods[0] &&
    !awaitingOvertime &&
    !regulationTied &&
    !isSubmitting &&
    !match.completed

  const overtimeReady =
    playable &&
    phase === 'ready' &&
    !isSubmitting &&
    !match.completed &&
    (awaitingOvertime || regulationTied) &&
    scores.otHome === 0 &&
    scores.otAway === 0

  const formatPeriodScore = (home: number, away: number, completed: boolean) =>
    completed ? `${home}:${away}` : '-'

  const renderPeriodBox = (slot: PeriodSlot, label: string, scoreText: string) => {
    if (!slot) return null
    const highlighted = isPeriodHighlighted(phase, slot)
    const timerHere = showTimer && timerSlot === slot

    const goalLines: string[] =
      match.completed && 'goals' in match && match.goals
        ? match.goals
            .filter((g) => apiPeriodToSlot(g.period) === slot)
            .map((g) => formatGoalLine(g.team.shortName, g.scorer.name, g.assist?.name))
        : goalEvents
            .filter((g) => g.period === periodSlotToApi(slot))
            .map((g) => resolveGoalDisplay(g, match.homeTeam, match.awayTeam))

    return (
      <div className="match-period">
        <div
          className={`match-period__box${highlighted ? ' match-period__box--active' : ''}`}
          style={styles.scoreColumn}
        >
          <span style={styles.scoreLabel}>{label}</span>
          <span>{scoreText}</span>
        </div>
        <div className="match-period__timer" aria-hidden={!timerHere}>
          {timerHere ? `${secondsLeft}s` : '\u00A0'}
        </div>
        {goalLines.length > 0 && (
          <div className="match-period__goals">
            {goalLines.map((line, index) => (
              <div
                key={`${slot}-${index}`}
                className={
                  highlighted && index === goalLines.length - 1
                    ? 'match-period__goal--latest'
                    : undefined
                }
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const cardClassName = [
    'match-card',
    isFinished ? 'match-card--finished' : '',
    isLive ? 'match-card--live' : '',
    !playable && !isFinished ? 'match-card--locked' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClassName} style={styles.card}>
      <div style={styles.header}>
        <div style={styles.teamBlock}>
          <strong className={homeWon ? 'match-team-name match-team-name--winner' : 'match-team-name'}>
            {match.homeTeam.name}
          </strong>
        </div>
        <div style={styles.teamBlockRight}>
          <strong className={awayWon ? 'match-team-name match-team-name--winner' : 'match-team-name'}>
            {match.awayTeam.name}
          </strong>
        </div>
      </div>

      <div style={styles.scoreLine}>
        <span style={styles.shortName}>{match.homeTeam.shortName}</span>
        <span
          key={scoreFlash === 'home' ? `home-${flashKey}` : 'home-score'}
          className={
            scoreFlash === 'home'
              ? 'match-score-value match-score-value--tick'
              : 'match-score-value'
          }
          style={styles.scoreValue}
        >
          {homeTotal}
        </span>
        <span style={styles.scoreDash}>-</span>
        <span
          key={scoreFlash === 'away' ? `away-${flashKey}` : 'away-score'}
          className={
            scoreFlash === 'away'
              ? 'match-score-value match-score-value--tick'
              : 'match-score-value'
          }
          style={styles.scoreValue}
        >
          {awayTotal}
        </span>
        <span style={styles.shortName}>{match.awayTeam.shortName}</span>
      </div>

      <div style={styles.scoreGrid}>
        {renderPeriodBox(
          '1P',
          '1P',
          formatPeriodScore(
            scores.home[0],
            scores.away[0],
            completedPeriods[0] || phase === 'period1' || phase === 'break1',
          ),
        )}
        {renderPeriodBox(
          '2P',
          '2P',
          formatPeriodScore(
            scores.home[1],
            scores.away[1],
            completedPeriods[1] || phase === 'period2' || phase === 'break2',
          ),
        )}
        {renderPeriodBox(
          '3P',
          '3P',
          formatPeriodScore(
            scores.home[2],
            scores.away[2],
            completedPeriods[2] || phase === 'period3',
          ),
        )}
        {showOvertime &&
          renderPeriodBox(
            'OT',
            'OT',
            phase === 'overtime' || scores.otHome > 0 || scores.otAway > 0 || match.completed
              ? `${scores.otHome}:${scores.otAway}`
              : '-',
          )}
      </div>

      <div style={styles.actions}>
        {canStartMatch && (
          <button type="button" style={styles.startButton} onClick={startMatch}>
            Start match
          </button>
        )}
        {overtimeReady && (
          <button type="button" style={styles.otButton} onClick={playOvertime}>
            Play Overtime
          </button>
        )}
      </div>

      {statusMessage && <p className="match-status-text">{statusMessage}</p>}
      {!playable && !match.completed && (
        <p style={styles.lockedText}>{lockedMessage}</p>
      )}
    </div>
  )
}

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
  },
  teamBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flex: 1,
    color: 'var(--text-h)',
    textAlign: 'left' as const,
  },
  teamBlockRight: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flex: 1,
    color: 'var(--text-h)',
    textAlign: 'right' as const,
  },
  scoreLine: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-h)',
  },
  shortName: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  scoreValue: {
    minWidth: '1.25rem',
    textAlign: 'center' as const,
    color: 'var(--green-bright)',
  },
  scoreDash: {
    color: 'var(--text-muted)',
  },
  scoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
    gap: '10px',
  } satisfies CSSProperties,
  scoreColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: 'var(--surface-raised)',
    color: 'var(--text-h)',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  scoreLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  startButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--green)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  otButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--green-dim)',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  lockedText: {
    margin: 0,
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
}

export default MatchCard
