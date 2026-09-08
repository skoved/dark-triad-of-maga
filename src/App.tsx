import { useGameState } from './hooks/useGameState';
import { TitleScreen } from './components/TitleScreen';
import { PlayScreen } from './components/PlayScreen';
import { SummaryBoard } from './components/SummaryBoard';

export default function App() {
  const game = useGameState();

  if (game.phase === 'title') {
    return <TitleScreen onEnter={game.newGame} />;
  }

  if (game.phase === 'summary') {
    return <SummaryBoard placed={game.placed} onReset={game.reset} />;
  }

  if (!game.currentOfficial) {
    // Defensive: playing with nobody to place -> treat as finished.
    return <SummaryBoard placed={game.placed} onReset={game.reset} />;
  }

  return (
    <PlayScreen
      official={game.currentOfficial}
      index={game.currentIndex}
      total={game.total}
      placed={game.placed}
      onPlace={game.place}
    />
  );
}
