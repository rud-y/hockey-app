import { useCallback, useEffect, useState } from 'react'
import './App.css'
import FixturesPanel from './components/FixturesPanel'
import LeagueTable from './components/LeagueTable'
import PlayoffsPanel from './components/PlayoffsPanel'
import TeamForm from './components/TeamForm'
import { API_BASE_URL, LEAGUE_CONFIG } from './constants/api'
import { type FixturesResponseProps } from './interfaces/matchProps'
import { type PlayoffBracketProps } from './interfaces/playoffProps'
import { type TableRowProps } from './interfaces/tableRowProps'

function App() {
  const [standings, setStandings] = useState<TableRowProps[]>([])
  const [fixturesData, setFixturesData] = useState<FixturesResponseProps | null>(null)
  const [playoffs, setPlayoffs] = useState<PlayoffBracketProps | null>(null)

  const loadStandings = useCallback(() => {
    const params = new URLSearchParams({
      competitionType: LEAGUE_CONFIG.competitionType,
      seasonYear: LEAGUE_CONFIG.seasonYear,
    })

    fetch(`${API_BASE_URL}/league-tables?${params}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load league table')
        }
        return res.json()
      })
      .then((data: TableRowProps[]) => {
        setStandings(data)
      })
      .catch((err) => console.error('Error fetching standings:', err))
  }, [])

  const loadFixtures = useCallback(() => {
    const params = new URLSearchParams({
      competitionType: LEAGUE_CONFIG.competitionType,
      seasonYear: LEAGUE_CONFIG.seasonYear,
    })

    fetch(`${API_BASE_URL}/fixtures?${params}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load fixtures')
        }
        return res.json()
      })
      .then((data: FixturesResponseProps) => {
        setFixturesData(data.fixtures.length > 0 ? data : null)
      })
      .catch((err) => console.error('Error fetching fixtures:', err))
  }, [])

  const loadPlayoffs = useCallback(() => {
    const params = new URLSearchParams({
      seasonYear: LEAGUE_CONFIG.seasonYear,
    })

    fetch(`${API_BASE_URL}/playoffs?${params}`)
      .then((res) => {
        if (res.status === 204) {
          setPlayoffs(null)
          return null
        }
        if (!res.ok) {
          throw new Error('Failed to load playoffs')
        }
        return res.json()
      })
      .then((data: PlayoffBracketProps | null) => {
        if (data) {
          setPlayoffs(data)
        }
      })
      .catch((err) => console.error('Error fetching playoffs:', err))
  }, [])

  const handleMatchCompleted = useCallback((standingsFromMatch?: TableRowProps[]) => {
    if (standingsFromMatch) {
      setStandings(standingsFromMatch)
    } else {
      loadStandings()
    }
    loadFixtures()
  }, [loadStandings, loadFixtures])

  const handleSeasonRestarted = useCallback(() => {
    setPlayoffs(null)
    loadStandings()
    loadFixtures()
    loadPlayoffs()
  }, [loadStandings, loadFixtures, loadPlayoffs])

  const handleStartFromScratch = useCallback(() => {
    setPlayoffs(null)
    setFixturesData(null)
    loadStandings()
    loadFixtures()
    loadPlayoffs()
  }, [loadStandings, loadFixtures, loadPlayoffs])

  useEffect(() => {
    loadStandings()
    loadFixtures()
    loadPlayoffs()
  }, [loadStandings, loadFixtures, loadPlayoffs])

  const seasonComplete = (() => {
    if (!fixturesData || fixturesData.fixtures.length === 0) {
      return false
    }

    const { activeWeekNumber, totalWeeks, fixtures } = fixturesData
    const currentWeek = fixtures.find((fixture) => fixture.weekNumber === activeWeekNumber)
    if (!currentWeek || activeWeekNumber < totalWeeks) {
      return false
    }

    return currentWeek.matches.every((match) => match.completed)
  })()

  const playoffsStarted = playoffs != null
  const playoffsComplete = playoffs?.status === 'COMPLETED'

  return (
    <>
      <section id="center">
        <h1>Ice Hockey League App</h1>
        {!((fixturesData?.fixtures.length ?? 0) > 0) && !playoffsStarted && (
          <TeamForm
            onTeamCreated={loadStandings}
            existingRows={standings}
            fixturesGenerated={(fixturesData?.fixtures.length ?? 0) > 0}
            onFixturesGenerated={loadFixtures}
          />
        )}
        <LeagueTable
          rows={standings}
          seasonComplete={seasonComplete}
          playoffsStarted={playoffsStarted}
          playoffsComplete={playoffsComplete}
          onRowDeleted={loadStandings}
          onPlayoffsStarted={loadPlayoffs}
        />
        {playoffs && (
          <PlayoffsPanel
            bracket={playoffs}
            onBracketUpdated={setPlayoffs}
            onRestartSeason={handleSeasonRestarted}
            onStartFromScratch={handleStartFromScratch}
          />
        )}
        <FixturesPanel
          fixturesData={fixturesData}
          onMatchCompleted={handleMatchCompleted}
          onWeekAdvanced={loadFixtures}
          onSeasonRestarted={handleSeasonRestarted}
          playoffsStarted={playoffsStarted}
          playoffsComplete={playoffsComplete}
        />
      </section>

      <div className="ticks"></div>
    </>
  )
}

export default App
