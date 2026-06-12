import { useEffect, useState } from "react";
import { type TeamProps } from "../interfaces/teamProps";

const Team: React.FC<TeamProps> = () => {
  const [teams, setTeams] = useState<TeamProps[]>([]);


  useEffect(() => {
   try {
    fetch("http://localhost:8080/teams/")
      .then((res) => res.json())
      .then((data) => setTeams(data.data || data))
   }
     catch(err) {
      console.error("Error fetching teams: ", err)
     }
}, [])
   console.log("TEAMS-- ", teams);

  return (
    <div className="team-card" style={styles.card}>
      <div style={styles.header}>
       <h1>TEAMS</h1>
      </div>
        {teams && teams.map((team) => (
          <>
            <h2 style={styles.name}>{team?.name}</h2>
            <h4>{team.shortName}</h4>
          </>
        ))}

      <hr style={styles.divider} />
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "20px",
    margin: "16px 0",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    margin: 0,
    fontSize: "1.5rem",
    color: "#1a1a1a",
  },
  badge: {
    backgroundColor: "#f0f4f8",
    color: "#3b82f6",
    padding: "4px 10px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "0.9rem",
    textTransform: "uppercase" as const,
  },
  divider: {
    border: 0,
    borderTop: "1px solid #eee",
    margin: "16px 0",
  },
  emptyText: {
    margin: 0,
    color: "#999",
    fontSize: "0.9rem",
    fontStyle: "italic" as const,
  },
};

export default Team;