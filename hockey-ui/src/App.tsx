import { useCallback, useEffect, useState } from 'react'
import './App.css'
import LeagueTable from './components/LeagueTable'
import TeamForm from './components/TeamForm'
import { API_BASE_URL, LEAGUE_CONFIG } from './constants/api'
import { type TableRowProps } from './interfaces/tableRowProps'

function App() {
  const [standings, setStandings] = useState<TableRowProps[]>([])

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
        console.log('STANDINGS-- ', data)
      })
      .catch((err) => console.error('Error fetching standings:', err))
  }, [])

  useEffect(() => {
    loadStandings()
  }, [loadStandings])

  return (
    <>
      <section id="center">
        <h1>Ice Hockey League App</h1>
        <TeamForm onTeamCreated={loadStandings} existingRows={standings} />
        <LeagueTable rows={standings} onRowDeleted={loadStandings} />
      </section>

      <div className="ticks"></div>
    </>
  )
}

export default App
