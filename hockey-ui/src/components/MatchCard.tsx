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
  BREAK_DURATION_SECONDS,
  PERIOD_DURATION_SECONDS,
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

interface PeriodScores {
  home: [number, number, number]
  away: [number, number, number]
  otHome: number
  otAway: number
}

const PLAYOFF_NEXT_GAME_DELAY_MS = 3000

const activePeriodSlot = (phase: MatchPhase): PeriodSlot => {
  if (phase === 'period1' || phase === 'break1') return '1P'
  if (phase === 'period2' || phase === 'break2') return '2P'
  if (phase === 'period3' || phase === 'break3') return '3P'
  if (phase === 'overtime') return 'OT'
  return null
}

const isPeriodInProgress = (phase: MatchPhase, slot: PeriodSlot) => {
  if (slot === '1P') return phase === 'period1'
  if (slot === '2P') return phase === 'period2'
  if (slot === '3P') return phase === 'period3'
  if (slot === 'OT') return phase === 'overtime'
  return false
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
  const handledTickRef = useRef<string | null>(null)
  const hasSubmittedRef = useRef(match.completed)
  const scoresRef = useRef(scores)
  const playoffDelayRef = useRef<number | null>(null)

  useEffect(() => {
    scoresRef.current = scores
  }, [scores])

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
  const showTimer = (periodRunning || breakRunning) && secondsLeft >= 0 && timerSlot != null

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
          }, PLAYOFF_NEXT_GAME_DELAY_MS)
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

  const startMatch = () => {
    setAutoPlay(true)
    setAwaitingOvertime(false)
    setStatusMessage(null)
    setPhase('period1')
    setSecondsLeft(PERIOD_DURATION_SECONDS)
  }

  const playOvertime = () => {
    handledTickRef.current = null
    setAutoPlay(false)
    setStatusMessage(null)
    setPhase('overtime')
    setSecondsLeft(PERIOD_DURATION_SECONDS)
  }

  useEffect(() => {
    if (secondsLeft <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current - 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [secondsLeft])

  useEffect(() => {
    if (secondsLeft > 0) {
      return
    }

    const tickKey = `${phase}:0`
    if (handledTickRef.current === tickKey) {
      return
    }
    handledTickRef.current = tickKey

    if (phase === 'period1') {
      const homeScore = randomPeriodScore()
      const awayScore = randomPeriodScore()
      setScores((current) => ({
        ...current,
        home: [homeScore, current.home[1], current.home[2]],
        away: [awayScore, current.away[1], current.away[2]],
      }))
      setCompletedPeriods((current) => [true, current[1], current[2]])
      setStatusMessage('Break time')
      setPhase('break1')
      setSecondsLeft(BREAK_DURATION_SECONDS)
      return
    }

    if (phase === 'period2') {
      const homeScore = randomPeriodScore()
      const awayScore = randomPeriodScore()
      setScores((current) => ({
        ...current,
        home: [current.home[0], homeScore, current.home[2]],
        away: [current.away[0], awayScore, current.away[2]],
      }))
      setCompletedPeriods((current) => [current[0], true, current[2]])
      setStatusMessage('Break time')
      setPhase('break2')
      setSecondsLeft(BREAK_DURATION_SECONDS)
      return
    }

    if (phase === 'period3') {
      const homeScore = randomPeriodScore()
      const awayScore = randomPeriodScore()
      const nextHome: [number, number, number] = [
        scores.home[0],
        scores.home[1],
        homeScore,
      ]
      const nextAway: [number, number, number] = [
        scores.away[0],
        scores.away[1],
        awayScore,
      ]
      const nextScores: PeriodScores = {
        ...scores,
        home: nextHome,
        away: nextAway,
      }

      setScores(nextScores)
      setCompletedPeriods([true, true, true])

      if (sumScores(nextHome) === sumScores(nextAway)) {
        setAutoPlay(false)
        setAwaitingOvertime(true)
        setStatusMessage('Play overtime to decide the winner')
        setPhase('ready')
      } else {
        finishMatch(nextScores)
      }
      return
    }

    if (phase === 'overtime') {
      const otScore = randomOvertimeScore()
      const nextScores: PeriodScores = {
        ...scoresRef.current,
        otHome: otScore.home,
        otAway: otScore.away,
      }

      setScores(nextScores)
      finishMatch(nextScores)
      return
    }

    if (phase === 'break1') {
      setStatusMessage(null)
      if (autoPlay) {
        setPhase('period2')
        setSecondsLeft(PERIOD_DURATION_SECONDS)
      } else {
        setPhase('ready')
      }
      return
    }

    if (phase === 'break2') {
      setStatusMessage(null)
      if (autoPlay) {
        setPhase('period3')
        setSecondsLeft(PERIOD_DURATION_SECONDS)
      } else {
        setPhase('ready')
      }
      return
    }
  }, [phase, secondsLeft, finishMatch, autoPlay, scores])

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

  const renderPeriodBox = (
    slot: PeriodSlot,
    label: string,
    scoreText: string,
  ) => {
    if (!slot) return null
    const inProgress = isPeriodInProgress(phase, slot)
    const timerHere = showTimer && timerSlot === slot

    return (
      <div className="match-period">
        <div
          className={`match-period__box${inProgress ? ' match-period__box--active' : ''}`}
          style={styles.scoreColumn}
        >
          <span style={styles.scoreLabel}>{label}</span>
          <span>{scoreText}</span>
        </div>
        <div className="match-period__timer" aria-hidden={!timerHere}>
          {timerHere ? `${secondsLeft}s` : '\u00A0'}
        </div>
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
        <span style={styles.scoreValue}>{homeTotal}</span>
        <span style={styles.scoreDash}>-</span>
        <span style={styles.scoreValue}>{awayTotal}</span>
        <span style={styles.shortName}>{match.awayTeam.shortName}</span>
      </div>

      <div style={styles.scoreGrid}>
        {renderPeriodBox(
          '1P',
          '1P',
          formatPeriodScore(scores.home[0], scores.away[0], completedPeriods[0]),
        )}
        {renderPeriodBox(
          '2P',
          '2P',
          formatPeriodScore(scores.home[1], scores.away[1], completedPeriods[1]),
        )}
        {renderPeriodBox(
          '3P',
          '3P',
          formatPeriodScore(scores.home[2], scores.away[2], completedPeriods[2]),
        )}
        {showOvertime &&
          renderPeriodBox(
            'OT',
            'OT',
            scores.otHome > 0 || scores.otAway > 0 || match.completed
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
