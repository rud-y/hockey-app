import MatchCard from './MatchCard'
import { type WeeklyFixtureProps } from '../interfaces/matchProps'

interface FixturesPanelProps {
  fixtures: WeeklyFixtureProps[]
  onMatchCompleted: () => void
}

const FixturesPanel: React.FC<FixturesPanelProps> = ({ fixtures, onMatchCompleted }) => {
  if (fixtures.length === 0) {
    return null
  }

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Season Fixtures</h2>
      <p style={styles.subtitle}>
        All matches are shown below. You can start and run multiple matches at the same time.
      </p>

      {fixtures.map((fixture) => (
        <section key={fixture.id} style={styles.weekSection}>
          <h3 style={styles.weekTitle}>Fixtures Week {fixture.weekNumber}</h3>
          <div style={styles.matchGrid}>
            {fixture.matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onMatchCompleted={onMatchCompleted}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

const styles = {
  wrapper: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#1a1a1a',
  },
  subtitle: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.95rem',
  },
  weekSection: {
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.04)',
  },
  weekTitle: {
    margin: '0 0 16px',
    fontSize: '1.1rem',
    color: '#111827',
  },
  matchGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
}

export default FixturesPanel
