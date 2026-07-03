import { useCallback, useEffect, useState } from 'react'
import './App.css'
import FixturesPanel from './components/FixturesPanel'
import LeagueTable from './components/LeagueTable'
import TeamForm from './components/TeamForm'
import { API_BASE_URL, LEAGUE_CONFIG } from './constants/api'
import { type WeeklyFixtureProps } from './interfaces/matchProps'
import { type TableRowProps } from './interfaces/tableRowProps'

function App() {
  const [standings, setStandings] = useState<TableRowProps[]>([])
  const [fixtures, setFixtures] = useState<WeeklyFixtureProps[]>([])

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
      .then((data: WeeklyFixtureProps[]) => {
        setFixtures(data)
      })
      .catch((err) => console.error('Error fetching fixtures:', err))
  }, [])

  const handleMatchCompleted = useCallback(() => {
    loadStandings()
    loadFixtures()
  }, [loadStandings, loadFixtures])

  useEffect(() => {
    loadStandings()
    loadFixtures()
  }, [loadStandings, loadFixtures])

  return (
    <>
      <section id="center">
        <h1>Ice Hockey League App</h1>
        <TeamForm
          onTeamCreated={loadStandings}
          existingRows={standings}
          fixturesGenerated={fixtures.length > 0}
          onFixturesGenerated={loadFixtures}
        />
        <LeagueTable rows={standings} onRowDeleted={loadStandings} />
        <FixturesPanel fixtures={fixtures} onMatchCompleted={handleMatchCompleted} />
      </section>

      <div className="ticks"></div>
    </>
  )
}

export default App
