import { useState } from "react";

type Team = {
 name: string;
 shortcut: string;
 players: [];
}

function Team() {
 const [ teams, setTeams] = useState([]);

 const teamsData = fetch("")
 .then(res => res.json())
 .then(data => setTeams(data))

 console.log("TEAMS-- ", teamsData)
}

export default Team;