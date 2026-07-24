import { API_BASE_URL } from '../constants/api'
import {
  type PlayoffBracketProps,
  type PlayoffSeriesProps,
} from '../interfaces/playoffProps'
import { gameTotalScore } from '../utils/playoffs'
import MatchCard from './MatchCard'

interface PlayoffSeriesCardProps {
  series: PlayoffSeriesProps
  playable: boolean
  onSeriesUpdated: (bracket: PlayoffBracketProps) => void
}

const PlayoffSeriesCard: React.FC<PlayoffSeriesCardProps> = ({
  series,
  playable,
  onSeriesUpdated,
}) => {
  const nextGame = series.games.find((game) => !game.completed)
  const completedGames = series.games.filter((game) => game.completed)

  const higherIsWinning =
    series.winner?.id === series.higherSeedTeam.id ||
    (!series.completed && series.higherSeedWins > series.lowerSeedWins)
  const lowerIsWinning =
    series.winner?.id === series.lowerSeedTeam.id ||
    (!series.completed && series.lowerSeedWins > series.higherSeedWins)

  return (
    <article
      className={`playoff-series-card${series.completed ? ' playoff-series-card--complete' : ''}`}
    >
      <header className="playoff-series-card__header">
        <div className="playoff-series-card__team">
          <span className="playoff-series-card__seed">#{series.higherSeedRank}</span>
          <strong className={higherIsWinning ? 'playoff-series-card__name--winning' : undefined}>
            {series.higherSeedTeam.name}
          </strong>
          <span className="playoff-series-card__short">({series.higherSeedTeam.shortName})</span>
        </div>
        <div className="playoff-series-card__score" aria-label="Series score">
          <span>{series.higherSeedWins}</span>
          <span className="playoff-series-card__score-sep">–</span>
          <span>{series.lowerSeedWins}</span>
        </div>
        <div className="playoff-series-card__team playoff-series-card__team--right">
          <span className="playoff-series-card__seed">#{series.lowerSeedRank}</span>
          <strong className={lowerIsWinning ? 'playoff-series-card__name--winning' : undefined}>
            {series.lowerSeedTeam.name}
          </strong>
          <span className="playoff-series-card__short">({series.lowerSeedTeam.shortName})</span>
        </div>
      </header>

      <p className="playoff-series-card__status">
        {series.completed && series.winner
          ? `${series.winner.name} win the series ${Math.max(series.higherSeedWins, series.lowerSeedWins)}–${Math.min(series.higherSeedWins, series.lowerSeedWins)}`
          : `First to 4 wins · Game ${(nextGame?.gameNumber ?? series.games.length)} of up to 7`}
      </p>

      {completedGames.length > 0 && (
        <ul className="playoff-series-card__results">
          {[...completedGames].reverse().map((game) => {
            const totals = gameTotalScore(game)
            return (
              <li key={game.id}>
                Game {game.gameNumber}: {game.homeTeam.shortName} {totals.home}–{totals.away}{' '}
                {game.awayTeam.shortName}
              </li>
            )
          })}
        </ul>
      )}

      {nextGame && !series.completed && (
        <div className="playoff-series-card__next">
          <h4 className="playoff-series-card__next-title">Game {nextGame.gameNumber}</h4>
          <MatchCard
            key={nextGame.id}
            match={nextGame}
            playable={playable}
            completeUrl={`${API_BASE_URL}/playoffs/games/${nextGame.id}/complete`}
            onPlayoffCompleted={onSeriesUpdated}
            lockedMessage="Finish other series in this round first, or wait for this series' next game."
          />
        </div>
      )}
    </article>
  )
}

export default PlayoffSeriesCard
