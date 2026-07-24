import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL, LEAGUE_CONFIG } from '../constants/api'
import {
  type FixturesResponseProps,
  type WeeklyFixtureProps,
} from '../interfaces/matchProps'
import { type TableRowProps } from '../interfaces/tableRowProps'
import MatchCard from './MatchCard'

interface FixturesPanelProps {
  fixturesData: FixturesResponseProps | null
  onMatchCompleted: (standings?: TableRowProps[]) => void
  onWeekAdvanced: () => void
  onSeasonRestarted: () => void
  playoffsStarted?: boolean
  playoffsComplete?: boolean
}

const isWeekComplete = (fixture: WeeklyFixtureProps) =>
  fixture.matches.every((match) => match.completed)

const countCompletedMatches = (fixture: WeeklyFixtureProps) =>
  fixture.matches.filter((match) => match.completed).length

const FixturesPanel: React.FC<FixturesPanelProps> = ({
  fixturesData,
  onMatchCompleted,
  onWeekAdvanced,
  onSeasonRestarted,
  playoffsStarted = false,
  playoffsComplete = false,
}) => {
  const [remainingExpanded, setRemainingExpanded] = useState(false)
  const [pastExpanded, setPastExpanded] = useState(false)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visibleWeekNumber, setVisibleWeekNumber] = useState(
    () => fixturesData?.activeWeekNumber ?? 1,
  )
  const [weekFade, setWeekFade] = useState<'idle' | 'out' | 'in'>('in')

  const panelRef = useRef<HTMLDivElement>(null)
  const currentWeekRef = useRef<HTMLDivElement>(null)
  const prevActiveWeek = useRef(fixturesData?.activeWeekNumber ?? 1)

  const activeWeekNumber = fixturesData?.activeWeekNumber ?? 1

  useEffect(() => {
    if (activeWeekNumber === prevActiveWeek.current) {
      return
    }

    setWeekFade('out')

    const fadeOutTimer = window.setTimeout(() => {
      setVisibleWeekNumber(activeWeekNumber)
      setWeekFade('in')
      prevActiveWeek.current = activeWeekNumber

      window.setTimeout(() => {
        currentWeekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        setWeekFade('idle')
      }, 320)
    }, 280)

    return () => window.clearTimeout(fadeOutTimer)
  }, [activeWeekNumber])

  useEffect(() => {
    if (!fixturesData) {
      return
    }

    if (prevActiveWeek.current === fixturesData.activeWeekNumber) {
      setVisibleWeekNumber(fixturesData.activeWeekNumber)
    }
  }, [fixturesData])

  if (!fixturesData || fixturesData.fixtures.length === 0) {
    return null
  }

  const { totalWeeks, fixtures } = fixturesData
  const currentWeek = fixtures.find((fixture) => fixture.weekNumber === visibleWeekNumber)
  const actualCurrentWeek = fixtures.find((fixture) => fixture.weekNumber === activeWeekNumber)
  const pastWeeks = fixtures.filter((fixture) => fixture.weekNumber < activeWeekNumber)
  const remainingWeeks = fixtures.filter((fixture) => fixture.weekNumber > activeWeekNumber)
  const currentWeekComplete = actualCurrentWeek ? isWeekComplete(actualCurrentWeek) : false
  const seasonComplete = activeWeekNumber >= totalWeeks && currentWeekComplete
  const hideDuringPlayoffs = playoffsStarted && !playoffsComplete
  const reviewOnlyAfterPlayoffs = playoffsComplete

  const completedInWeek = actualCurrentWeek ? countCompletedMatches(actualCurrentWeek) : 0
  const totalInWeek = actualCurrentWeek?.matches.length ?? 0

  const pastWeeksDescending = [...pastWeeks].sort((a, b) => b.weekNumber - a.weekNumber)
  const reviewWeeks = [...(seasonComplete || reviewOnlyAfterPlayoffs ? fixtures : pastWeeks)].sort(
    (a, b) => b.weekNumber - a.weekNumber,
  )
  const remainingWeeksSorted = [...remainingWeeks].sort((a, b) => b.weekNumber - a.weekNumber)
  const reviewToggleLabel = seasonComplete || reviewOnlyAfterPlayoffs
    ? pastExpanded
      ? 'Close all fixtures'
      : 'Expand all fixtures'
    : pastExpanded
      ? 'Close past fixtures'
      : 'Expand past fixtures'

  const handleAdvanceWeek = async () => {
    setError(null)
    setIsAdvancing(true)
    setWeekFade('out')

    try {
      const response = await fetch(`${API_BASE_URL}/fixtures/advance-week`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionType: LEAGUE_CONFIG.competitionType,
          seasonYear: LEAGUE_CONFIG.seasonYear,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to advance to the next week.')
      }

      setRemainingExpanded(false)
      setPastExpanded(true)
      onWeekAdvanced()
    } catch (err) {
      console.error('Error advancing week:', err)
      setError(err instanceof Error ? err.message : 'Could not advance to the next week.')
      setWeekFade('idle')
    } finally {
      setIsAdvancing(false)
    }
  }

  const handleRestartSeason = async () => {
    setError(null)
    setIsRestarting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/fixtures/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionType: LEAGUE_CONFIG.competitionType,
          seasonYear: LEAGUE_CONFIG.seasonYear,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.message ?? 'Failed to restart the season.')
      }

      setPastExpanded(false)
      setRemainingExpanded(false)
      setVisibleWeekNumber(1)
      prevActiveWeek.current = 1
      setWeekFade('in')
      onSeasonRestarted()
    } catch (err) {
      console.error('Error restarting season:', err)
      setError(err instanceof Error ? err.message : 'Could not restart the season.')
    } finally {
      setIsRestarting(false)
    }
  }

  const renderWeekSection = (
    fixture: WeeklyFixtureProps,
    playable: boolean,
    muted = false,
  ) => (
    <section
      key={fixture.id}
      className={`fixtures-week${muted ? ' fixtures-week--muted' : ''}${playable ? ' fixtures-week--active' : ''}`}
    >
      <h3 className="fixtures-week__title">
        Fixtures Week {fixture.weekNumber}
        {isWeekComplete(fixture) && (
          <span className="fixtures-week__badge">Completed</span>
        )}
      </h3>
      <div className="fixtures-week__matches">
        {fixture.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            playable={playable}
            onMatchCompleted={onMatchCompleted}
          />
        ))}
      </div>
    </section>
  )

  if (hideDuringPlayoffs) {
    return null
  }

  const weekFadeClass =
    weekFade === 'out'
      ? 'fixtures-current-week--fade-out'
      : weekFade === 'in'
        ? 'fixtures-current-week--fade-in'
        : ''

  return (
    <div ref={panelRef} className="fixtures-panel">
      <div className="fixtures-panel__header">
        <h2 className="fixtures-panel__title">Season Fixtures</h2>
        {!seasonComplete && !reviewOnlyAfterPlayoffs && (
          <div className="fixtures-progress" aria-label={`Week ${activeWeekNumber} of ${totalWeeks}`}>
            <span className="fixtures-progress__label">
              Week {activeWeekNumber} of {totalWeeks}
            </span>
            <div className="fixtures-progress__track">
              <div
                className="fixtures-progress__fill"
                style={{ width: `${(activeWeekNumber / totalWeeks) * 100}%` }}
              />
            </div>
            <div className="fixtures-progress__dots">
              {fixtures.map((fixture) => (
                <span
                  key={fixture.id}
                  className={[
                    'fixtures-progress__dot',
                    fixture.weekNumber < activeWeekNumber ? 'fixtures-progress__dot--done' : '',
                    fixture.weekNumber === activeWeekNumber ? 'fixtures-progress__dot--current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  title={`Week ${fixture.weekNumber}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {reviewOnlyAfterPlayoffs ? (
        <p className="fixtures-panel__subtitle">
          Regular season fixtures are available below for review.
        </p>
      ) : seasonComplete ? (
        <p className="fixtures-panel__subtitle">
          Season complete. Expand all fixtures below to review every match result.
        </p>
      ) : (
        <p className="fixtures-panel__subtitle">
          Only Fixtures Week {activeWeekNumber} can be played. Finish every match in this week
          before moving on.
        </p>
      )}

      {error && <p className="fixtures-panel__error">{error}</p>}

      {!seasonComplete && !reviewOnlyAfterPlayoffs && actualCurrentWeek && totalInWeek > 0 && (
        <div className="fixtures-week-status">
          <span>
            {completedInWeek} / {totalInWeek} matches played this week
          </span>
          <div className="fixtures-week-status__bar">
            <div
              className="fixtures-week-status__fill"
              style={{ width: `${(completedInWeek / totalInWeek) * 100}%` }}
            />
          </div>
        </div>
      )}

      {!seasonComplete && !reviewOnlyAfterPlayoffs && currentWeek && (
        <div
          ref={currentWeekRef}
          key={`week-${visibleWeekNumber}`}
          className={`fixtures-current-week ${weekFadeClass}${isAdvancing ? ' fixtures-current-week--loading' : ''}`}
        >
          {renderWeekSection(currentWeek, visibleWeekNumber === activeWeekNumber)}
        </div>
      )}

      {!seasonComplete &&
        !reviewOnlyAfterPlayoffs &&
        currentWeekComplete &&
        activeWeekNumber < totalWeeks && (
        <div className="fixtures-advance fixtures-advance--visible">
          <p className="fixtures-advance__message">
            Week {activeWeekNumber} is complete. Ready to play Week {activeWeekNumber + 1}?
          </p>
          <button
            type="button"
            className="fixtures-advance__button"
            disabled={isAdvancing}
            onClick={handleAdvanceWeek}
          >
            {isAdvancing ? 'Loading next week…' : 'Play next week fixtures'}
          </button>
        </div>
      )}

      {seasonComplete && !playoffsStarted && (
        <div className="fixtures-advance fixtures-advance--visible">
          <p className="fixtures-advance__message">
            Want another run with the same teams? Restart the season.
          </p>
          <button
            type="button"
            className="fixtures-advance__button"
            disabled={isRestarting}
            onClick={handleRestartSeason}
          >
            {isRestarting ? 'Starting new season…' : 'Play again with same teams'}
          </button>
        </div>
      )}

      {seasonComplete && !playoffsStarted && (
        <p className="fixtures-panel__season-complete">All fixture weeks have been completed.</p>
      )}

      {(seasonComplete || reviewOnlyAfterPlayoffs) && reviewWeeks.length > 0 && (
        <div className="fixtures-collapsible">
          <button
            type="button"
            className="fixtures-collapsible__toggle"
            onClick={() => setPastExpanded((expanded) => !expanded)}
            aria-expanded={pastExpanded}
          >
            {reviewToggleLabel}
          </button>

          <div
            className={`fixtures-collapsible__content${pastExpanded ? ' fixtures-collapsible__content--open' : ''}`}
          >
            <div className="fixtures-collapsible__inner">
              {reviewWeeks.map((fixture) => renderWeekSection(fixture, false, true))}
            </div>
          </div>
        </div>
      )}

      {!seasonComplete &&
        !reviewOnlyAfterPlayoffs &&
        pastWeeksDescending.length > 0 && (
        <div className="fixtures-collapsible">
          <button
            type="button"
            className="fixtures-collapsible__toggle"
            onClick={() => setPastExpanded((expanded) => !expanded)}
            aria-expanded={pastExpanded}
          >
            {pastExpanded ? 'Close past fixtures' : 'Expand past fixtures'}
          </button>

          <div
            className={`fixtures-collapsible__content${pastExpanded ? ' fixtures-collapsible__content--open' : ''}`}
          >
            <div className="fixtures-collapsible__inner">
              {pastWeeksDescending.map((fixture) => renderWeekSection(fixture, false, true))}
            </div>
          </div>
        </div>
      )}

      {!seasonComplete && !reviewOnlyAfterPlayoffs && remainingWeeks.length > 0 && (
        <div className="fixtures-collapsible">
          <button
            type="button"
            className="fixtures-collapsible__toggle"
            onClick={() => setRemainingExpanded((expanded) => !expanded)}
            aria-expanded={remainingExpanded}
          >
            {remainingExpanded ? 'Close remaining fixtures' : 'Expand remaining fixtures'}
          </button>

          <div
            className={`fixtures-collapsible__content${remainingExpanded ? ' fixtures-collapsible__content--open' : ''}`}
          >
            <div className="fixtures-collapsible__inner">
              {remainingWeeksSorted.map((fixture) => renderWeekSection(fixture, false, true))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FixturesPanel
