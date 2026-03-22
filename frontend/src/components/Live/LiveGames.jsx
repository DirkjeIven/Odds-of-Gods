import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function LiveGames() {
  const [liveGames, setLiveGames] = useState([])
  const [upcomingGames, setUpcomingGames] = useState([])
  const [finishedGames, setFinishedGames] = useState([])

  useEffect(() => {
    fetchGames()

    // Real-time Updates
    const subscription = supabase
      .channel('games')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => fetchGames()
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const fetchGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('start_time', { ascending: true })

    if (data) {
      setLiveGames(data.filter((g) => g.status === 'live'))
      setUpcomingGames(data.filter((g) => g.status === 'scheduled'))
      setFinishedGames(data.filter((g) => g.status === 'finished'))
    }
  }

  const GameCard = ({ game, finished = false }) => (
    <div style={{
      border: '1px solid #ddd',
      padding: '15px',
      marginBottom: '10px',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
        {game.team_a} vs {game.team_b}
      </p>
      {finished && game.winner && (
        <p style={{ color: '#28a745', fontSize: '16px' }}>
          ✅ Gewinner: <strong>{game.winner}</strong>
        </p>
      )}
      <p style={{ fontSize: '12px', color: '#666' }}>
        {new Date(game.start_time).toLocaleString('de-DE')}
      </p>
    </div>
  )

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🎮 Live Spiele</h1>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#dc3545' }}>🔴 Jetzt Live ({liveGames.length})</h2>
        {liveGames.length === 0 ? (
          <p style={{ color: '#666' }}>Keine Spiele live...</p>
        ) : (
          liveGames.map((game) => <GameCard key={game.id} game={game} />)
        )}
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>⏱️ Kommende Spiele ({upcomingGames.length})</h2>
        {upcomingGames.length === 0 ? (
          <p style={{ color: '#666' }}>Keine kommenden Spiele...</p>
        ) : (
          upcomingGames.slice(0, 5).map((game) => <GameCard key={game.id} game={game} />)
        )}
      </section>

      <section>
        <h2>✅ Abgeschlossene Spiele ({finishedGames.length})</h2>
        {finishedGames.length === 0 ? (
          <p style={{ color: '#666' }}>Keine abgeschlossenen Spiele...</p>
        ) : (
          finishedGames.map((game) => <GameCard key={game.id} game={game} finished={true} />)
        )}
      </section>
    </div>
  )
}