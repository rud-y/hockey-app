import { useEffect, useState } from 'react'
import './App.css'
import Team from './components/Team'
import { type TeamProps } from './interfaces/teamProps'

function App() {
  const [teams, setTeams] = useState<TeamProps[]>([])

  useEffect(() => {
    fetch('http://localhost:8080/teams/')
      .then((res) => res.json())
      .then((data: TeamProps[]) => {
        setTeams(data)
        console.log('TEAMS-- ', data)
      })
      .catch((err) => console.error('Error fetching teams:', err))
  }, [])

  return (
   <>
    <section id="center">
     <h1>Ice Hockey League App</h1>
     {teams.map((team) => (
       <Team
         key={team.id ?? team.shortName}
         id={team.id}
         name={team.name}
         shortName={team.shortName}
         players={team.players ?? []}
       />
     ))}
    </section>

     <div className="ticks"></div>
   </>
  )
}

export default App
