import { useCallback, useEffect, useState } from 'react'
import { API_BASE_URL } from '../constants/api'
import {
  type MatchProps,
  type MatchResultPayload,
} from '../interfaces/matchProps'
import {
  BREAK_DURATION_SECONDS,
  PERIOD_DURATION_SECONDS,
  randomOvertimeScore,
  randomPeriodScore,
  sumScores,
} from '../utils/matchSimulation'

interface MatchCardProps {
  match: MatchProps
  playable: boolean
  onMatchCompleted: () => void
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

interface PeriodScores {
  home: [number, number, number]
  away: [number, number, number]
  otHome: number
  otAway: number
}

const MatchCard: React.FC<MatchCardProps> = ({ match, playable, onMatchCompleted }) => {
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
  const [statusMessage, setStatusMessage] = useState<string | null>(
    match.completed ? 'Match finished' : null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const homeRegulation = sumScores(scores.home)
  const awayRegulation = sumScores(scores.away)
  const homeTotal = homeRegulation + scores.otHome
  const awayTotal = awayRegulation + scores.otAway
  const needsOvertime =
    completedPeriods[0] &&
    completedPeriods[1] &&
    completedPeriods[2] &&
    homeRegulation === awayRegulation
  const showOvertime =
    needsOvertime || scores.otHome > 0 || scores.otAway > 0 || match.homeScoreOt > 0

  const submitResult = useCallback(
    async (finalScores: PeriodScores) => {
      setIsSubmitting(true)

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
        const response = await fetch(`${API_BASE_URL}/matches/${match.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null)
          throw new Error(errorBody?.message ?? 'Failed to save match result.')
        }

        setPhase('finished')
        setStatusMessage('Match finished')
        onMatchCompleted()
      } catch (err) {
        console.error('Error completing match:', err)
        setStatusMessage(err instanceof Error ? err.message : 'Could not save match result.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [match.id, onMatchCompleted],
  )

  const finishMatch = useCallback(
    (nextScores: PeriodScores) => {
      void submitResult(nextScores)
    },
    [submitResult],
  )

  const startPeriod = (periodIndex: 0 | 1 | 2) => {
    const phaseMap: Record<0 | 1 | 2, MatchPhase> = {
      0: 'period1',
      1: 'period2',
      2: 'period3',
    }

    setStatusMessage(null)
    setPhase(phaseMap[periodIndex])
    setSecondsLeft(PERIOD_DURATION_SECONDS)
  }

  const startOvertime = () => {
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

    if (phase === 'period1') {
      const homeScore = randomPeriodScore()
      const awayScore = randomPeriodScore()
      setScores((current) => ({
        ...current,
        home: [homeScore, current.home[1], current.home[2]],
        away: [awayScore, current.away[1], current.away[2]],
      }))
      setCompletedPeriods((current) => [true, current[1], current[2]])
      setStatusMessage("It's break time")
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
      setStatusMessage("It's break time")
      setPhase('break2')
      setSecondsLeft(BREAK_DURATION_SECONDS)
      return
    }

    if (phase === 'period3') {
      const homeScore = randomPeriodScore()
      const awayScore = randomPeriodScore()

      setScores((current) => {
        const nextScores: PeriodScores = {
          ...current,
          home: [current.home[0], current.home[1], homeScore],
          away: [current.away[0], current.away[1], awayScore],
        }

        const homeTotal = sumScores(nextScores.home)
        const awayTotal = sumScores(nextScores.away)

        if (homeTotal === awayTotal) {
          setStatusMessage("It's break time - overtime needed")
          setPhase('break3')
          setSecondsLeft(BREAK_DURATION_SECONDS)
        } else {
          finishMatch(nextScores)
        }

        return nextScores
      })
      setCompletedPeriods((current) => [current[0], current[1], true])
      return
    }

    if (phase === 'overtime') {
      const otScore = randomOvertimeScore()
      setScores((current) => {
        const nextScores: PeriodScores = {
          ...current,
          otHome: otScore.home,
          otAway: otScore.away,
        }
        finishMatch(nextScores)
        return nextScores
      })
      return
    }

    if (phase === 'break1' || phase === 'break2' || phase === 'break3') {
      setStatusMessage(null)
      setPhase('ready')
    }
  }, [phase, secondsLeft, finishMatch])

  const periodRunning =
    phase === 'period1' || phase === 'period2' || phase === 'period3' || phase === 'overtime'
  const breakRunning = phase === 'break1' || phase === 'break2' || phase === 'break3'
  const isLocked =
    !playable || phase === 'finished' || isSubmitting || periodRunning || breakRunning

  const canStartPeriod = (periodIndex: 0 | 1 | 2) => {
    if (isLocked || phase !== 'ready') {
      return false
    }

    if (periodIndex === 0) {
      return !completedPeriods[0]
    }

    if (periodIndex === 1) {
      return completedPeriods[0] && !completedPeriods[1]
    }

    return completedPeriods[1] && !completedPeriods[2]
  }

  const overtimeReady =
    !isLocked &&
    phase === 'ready' &&
    completedPeriods[0] &&
    completedPeriods[1] &&
    completedPeriods[2] &&
    needsOvertime &&
    scores.otHome === 0 &&
    scores.otAway === 0

  const formatPeriodScore = (home: number, away: number, completed: boolean) =>
    completed ? `${home}:${away}` : '-'

  return (
    <div style={{ ...styles.card, ...(playable ? {} : styles.cardLocked) }}>
      <div style={styles.header}>
        <div style={styles.teamBlock}>
          <strong>{match.homeTeam.name}</strong>
        </div>
        <div style={styles.teamBlockRight}>
          <strong>{match.awayTeam.name}</strong>
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
        <div style={styles.scoreColumn}>
          <span style={styles.scoreLabel}>1P</span>
          <span>{formatPeriodScore(scores.home[0], scores.away[0], completedPeriods[0])}</span>
          <button
            type="button"
            style={styles.periodButton}
            disabled={!canStartPeriod(0)}
            onClick={() => startPeriod(0)}
          >
            Start 1P
          </button>
        </div>
        <div style={styles.scoreColumn}>
          <span style={styles.scoreLabel}>2P</span>
          <span>{formatPeriodScore(scores.home[1], scores.away[1], completedPeriods[1])}</span>
          <button
            type="button"
            style={styles.periodButton}
            disabled={!canStartPeriod(1)}
            onClick={() => startPeriod(1)}
          >
            Start 2P
          </button>
        </div>
        <div style={styles.scoreColumn}>
          <span style={styles.scoreLabel}>3P</span>
          <span>{formatPeriodScore(scores.home[2], scores.away[2], completedPeriods[2])}</span>
          <button
            type="button"
            style={styles.periodButton}
            disabled={!canStartPeriod(2)}
            onClick={() => startPeriod(2)}
          >
            Start 3P
          </button>
        </div>
        {showOvertime && (
          <div style={styles.scoreColumn}>
            <span style={styles.scoreLabel}>OT</span>
            <span>
              {scores.otHome > 0 || scores.otAway > 0 || match.completed
                ? `${scores.otHome}:${scores.otAway}`
                : '-'}
            </span>
            <button
              type="button"
              style={styles.periodButton}
              disabled={!overtimeReady}
              onClick={startOvertime}
            >
              Start OT
            </button>
          </div>
        )}
      </div>

      {(periodRunning || breakRunning) && (
        <div style={styles.footer}>
          <span style={styles.timer}>{secondsLeft}s</span>
        </div>
      )}

      {statusMessage && <p style={styles.status}>{statusMessage}</p>}
      {!playable && !match.completed && (
        <p style={styles.lockedText}>Available in a future fixture week</p>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--green-border)',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 12px var(--green-glow)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  cardLocked: {
    opacity: 0.72,
    border: '1px solid var(--border)',
    boxShadow: 'none',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
    gap: '10px',
  },
  scoreColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: 'var(--surface-raised)',
    color: 'var(--text-h)',
  },
  scoreLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
  },
  periodButton: {
    width: '100%',
    padding: '8px 6px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'var(--green)',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '0.9rem',
    color: 'var(--text)',
  },
  timer: {
    fontWeight: 700,
    color: 'var(--green-bright)',
  },
  status: {
    margin: 0,
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: 'var(--warning-bg)',
    color: 'var(--warning-text)',
    fontWeight: 600,
    textAlign: 'center' as const,
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
